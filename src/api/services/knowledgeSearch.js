const { db } = require('../../config/database');
const logger = require('../utils/logger');

/**
 * KnowledgeSearch — Organization-wide knowledge base search.
 *
 * The captured knowledge shouldn't be locked to individual departures.
 * It becomes an organizational asset — a "second brain" that persists
 * after employees leave.
 *
 * This service provides full-text search, semantic filtering, and
 * cross-departure knowledge aggregation.
 */
class KnowledgeSearch {
  /**
   * Search knowledge items across the organization.
   */
  async search(orgId, query, filters = {}) {
    let dbQuery = db('knowledge_items')
      .join('departures', 'knowledge_items.departure_id', 'departures.id')
      .join('knowledge_domains', 'knowledge_items.domain_id', 'knowledge_domains.id')
      .join('users as creator', 'knowledge_items.created_by', 'creator.id')
      .join('users as employee', 'departures.employee_id', 'employee.id')
      .where({ 'departures.org_id': orgId })
      .select(
        'knowledge_items.*',
        'knowledge_domains.name as domain_name',
        'knowledge_domains.category as domain_category',
        'departures.id as departure_id',
        'employee.first_name as source_first_name',
        'employee.last_name as source_last_name',
        'employee.department as source_department'
      );

    // Text search across title, content, and AI summary
    if (query) {
      dbQuery = dbQuery.where(function () {
        this.whereILike('knowledge_items.title', `%${query}%`)
          .orWhereILike('knowledge_items.content', `%${query}%`)
          .orWhereILike('knowledge_items.ai_summary', `%${query}%`);
      });
    }

    // Filter by knowledge type
    if (filters.type) {
      dbQuery = dbQuery.where({ 'knowledge_items.type': filters.type });
    }

    // Filter by category
    if (filters.category) {
      dbQuery = dbQuery.where({ 'knowledge_domains.category': filters.category });
    }

    // Filter by department
    if (filters.department) {
      dbQuery = dbQuery.where({ 'employee.department': filters.department });
    }

    // Filter by verification status
    if (filters.verified !== undefined) {
      dbQuery = dbQuery.where({ 'knowledge_items.is_verified': filters.verified });
    }

    // Filter by minimum quality score
    if (filters.minQuality) {
      dbQuery = dbQuery.where('knowledge_items.quality_score', '>=', filters.minQuality);
    }

    // Sort
    const sortField = filters.sortBy || 'created_at';
    const sortDir = filters.sortDir || 'desc';
    dbQuery = dbQuery.orderBy(`knowledge_items.${sortField}`, sortDir);

    // Pagination
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const offset = (page - 1) * limit;

    const items = await dbQuery.limit(limit).offset(offset);

    // Count total results
    let countQuery = db('knowledge_items')
      .join('departures', 'knowledge_items.departure_id', 'departures.id')
      .join('knowledge_domains', 'knowledge_items.domain_id', 'knowledge_domains.id')
      .join('users as employee', 'departures.employee_id', 'employee.id')
      .where({ 'departures.org_id': orgId });

    if (query) {
      countQuery = countQuery.where(function () {
        this.whereILike('knowledge_items.title', `%${query}%`)
          .orWhereILike('knowledge_items.content', `%${query}%`)
          .orWhereILike('knowledge_items.ai_summary', `%${query}%`);
      });
    }

    const [{ count }] = await countQuery.count();

    return {
      items,
      pagination: {
        page,
        limit,
        total: +count,
        pages: Math.ceil(+count / limit),
      },
    };
  }

  /**
   * Get knowledge base statistics for the organization.
   */
  async getOrgKnowledgeStats(orgId) {
    const [
      totalItems,
      verifiedItems,
      byType,
      byCategory,
      byDepartment,
      recentItems,
    ] = await Promise.all([
      db('knowledge_items')
        .join('departures', 'knowledge_items.departure_id', 'departures.id')
        .where({ 'departures.org_id': orgId })
        .count()
        .first(),
      db('knowledge_items')
        .join('departures', 'knowledge_items.departure_id', 'departures.id')
        .where({ 'departures.org_id': orgId, 'knowledge_items.is_verified': true })
        .count()
        .first(),
      db('knowledge_items')
        .join('departures', 'knowledge_items.departure_id', 'departures.id')
        .where({ 'departures.org_id': orgId })
        .groupBy('knowledge_items.type')
        .select('knowledge_items.type')
        .count(),
      db('knowledge_items')
        .join('departures', 'knowledge_items.departure_id', 'departures.id')
        .join('knowledge_domains', 'knowledge_items.domain_id', 'knowledge_domains.id')
        .where({ 'departures.org_id': orgId })
        .groupBy('knowledge_domains.category')
        .select('knowledge_domains.category')
        .count(),
      db('knowledge_items')
        .join('departures', 'knowledge_items.departure_id', 'departures.id')
        .join('users', 'departures.employee_id', 'users.id')
        .where({ 'departures.org_id': orgId })
        .groupBy('users.department')
        .select('users.department')
        .count(),
      db('knowledge_items')
        .join('departures', 'knowledge_items.departure_id', 'departures.id')
        .where({ 'departures.org_id': orgId })
        .orderBy('knowledge_items.created_at', 'desc')
        .limit(5)
        .select('knowledge_items.title', 'knowledge_items.type', 'knowledge_items.created_at'),
    ]);

    return {
      totalItems: +totalItems.count,
      verifiedItems: +verifiedItems.count,
      verificationRate: totalItems.count > 0
        ? Math.round((verifiedItems.count / totalItems.count) * 100)
        : 0,
      byType: Object.fromEntries(byType.map((r) => [r.type, +r.count])),
      byCategory: Object.fromEntries(byCategory.map((r) => [r.category, +r.count])),
      byDepartment: Object.fromEntries(byDepartment.map((r) => [r.department || 'Unknown', +r.count])),
      recentItems,
    };
  }
}

module.exports = new KnowledgeSearch();
