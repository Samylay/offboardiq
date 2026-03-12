import { db } from '../db';

export async function searchKnowledge(orgId, query, filters = {}) {
  let dbQuery = db('knowledge_items')
    .join('departures', 'knowledge_items.departure_id', 'departures.id')
    .join('knowledge_domains', 'knowledge_items.domain_id', 'knowledge_domains.id')
    .join('users as employee', 'departures.employee_id', 'employee.id')
    .where({ 'departures.org_id': orgId })
    .select(
      'knowledge_items.*',
      'knowledge_domains.name as domain_name',
      'knowledge_domains.category as domain_category',
      'employee.first_name as source_first_name',
      'employee.last_name as source_last_name',
      'employee.department as source_department'
    );

  if (query) {
    dbQuery = dbQuery.where(function () {
      this.whereILike('knowledge_items.title', `%${query}%`)
        .orWhereILike('knowledge_items.content', `%${query}%`)
        .orWhereILike('knowledge_items.ai_summary', `%${query}%`);
    });
  }

  if (filters.type) dbQuery = dbQuery.where({ 'knowledge_items.type': filters.type });
  if (filters.category) dbQuery = dbQuery.where({ 'knowledge_domains.category': filters.category });
  if (filters.department) dbQuery = dbQuery.where({ 'employee.department': filters.department });
  if (filters.verified !== undefined) dbQuery = dbQuery.where({ 'knowledge_items.is_verified': filters.verified });

  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 100);

  dbQuery = dbQuery.orderBy('knowledge_items.created_at', 'desc').limit(limit).offset((page - 1) * limit);
  const items = await dbQuery;

  let countQuery = db('knowledge_items')
    .join('departures', 'knowledge_items.departure_id', 'departures.id')
    .where({ 'departures.org_id': orgId });
  if (query) {
    countQuery = countQuery.where(function () {
      this.whereILike('knowledge_items.title', `%${query}%`)
        .orWhereILike('knowledge_items.content', `%${query}%`);
    });
  }
  const [{ count }] = await countQuery.count();

  return { items, pagination: { page, limit, total: +count, pages: Math.ceil(+count / limit) } };
}

export async function getOrgKnowledgeStats(orgId) {
  const [totalItems, verifiedItems, byType, byCategory] = await Promise.all([
    db('knowledge_items').join('departures', 'knowledge_items.departure_id', 'departures.id').where({ 'departures.org_id': orgId }).count().first(),
    db('knowledge_items').join('departures', 'knowledge_items.departure_id', 'departures.id').where({ 'departures.org_id': orgId, 'knowledge_items.is_verified': true }).count().first(),
    db('knowledge_items').join('departures', 'knowledge_items.departure_id', 'departures.id').where({ 'departures.org_id': orgId }).groupBy('knowledge_items.type').select('knowledge_items.type').count(),
    db('knowledge_items').join('departures', 'knowledge_items.departure_id', 'departures.id').join('knowledge_domains', 'knowledge_items.domain_id', 'knowledge_domains.id').where({ 'departures.org_id': orgId }).groupBy('knowledge_domains.category').select('knowledge_domains.category').count(),
  ]);

  return {
    totalItems: +totalItems.count,
    verifiedItems: +verifiedItems.count,
    verificationRate: totalItems.count > 0 ? Math.round((verifiedItems.count / totalItems.count) * 100) : 0,
    byType: Object.fromEntries(byType.map((r) => [r.type, +r.count])),
    byCategory: Object.fromEntries(byCategory.map((r) => [r.category, +r.count])),
  };
}
