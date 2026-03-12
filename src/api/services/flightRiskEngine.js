const { db } = require('../../config/database');
const logger = require('../utils/logger');

/**
 * FlightRiskEngine — PROACTIVE knowledge risk detection.
 *
 * This is the feature that moves OffboardIQ from "reactive offboarding tool"
 * to "organizational knowledge risk platform."
 *
 * The insight: by the time someone resigns, you've already lost the optimal
 * window for knowledge capture. The best offboarding starts BEFORE the resignation.
 *
 * This engine:
 * 1. Continuously maps knowledge concentration across the org
 * 2. Identifies "bus factor = 1" situations (one person holds critical knowledge)
 * 3. Scores organizational vulnerability by department/role/system
 * 4. Recommends proactive knowledge documentation even without pending departures
 *
 * Data signals (when HRIS integration is active):
 * - Tenure milestones (employees at 2yr+ tenure hold disproportionate tacit knowledge)
 * - Compensation band proximity to market rates (underpaid + high tenure = flight risk)
 * - Team concentration (small teams with specialized knowledge)
 * - Historical departure patterns (seasonal, post-review-cycle, etc.)
 *
 * Without HRIS, we use organizational structure data to compute:
 * - Knowledge concentration scores (who are the single points of failure?)
 * - Coverage maps (which domains have backup, which don't?)
 * - Vulnerability index (if this person left tomorrow, what's the blast radius?)
 */
class FlightRiskEngine {
  /**
   * Compute knowledge concentration map for an organization.
   * Identifies employees who are single points of failure.
   */
  async computeKnowledgeConcentrationMap(orgId) {
    const members = await db('users')
      .where({ org_id: orgId, is_active: true })
      .select('id', 'first_name', 'last_name', 'title', 'department');

    // Get all knowledge domains across completed departures to understand
    // what kinds of knowledge exist in each department
    const historicalDomains = await db('knowledge_domains')
      .where({ org_id: orgId })
      .select('*');

    // Analyze team sizes by department
    const departments = {};
    for (const member of members) {
      const dept = member.department || 'Unknown';
      if (!departments[dept]) {
        departments[dept] = { members: [], uniqueRoles: new Set() };
      }
      departments[dept].members.push(member);
      if (member.title) departments[dept].uniqueRoles.add(member.title);
    }

    const vulnerabilities = [];

    for (const [deptName, dept] of Object.entries(departments)) {
      const teamSize = dept.members.length;
      const uniqueRoles = dept.uniqueRoles.size;

      // Bus factor: unique roles / team size. If ratio approaches 1.0,
      // every person is a single point of failure
      const busFactor = uniqueRoles / Math.max(teamSize, 1);

      // Small teams with many unique roles are highest risk
      const vulnerabilityScore = Math.min(100, busFactor * 60 + (teamSize <= 3 ? 30 : 0));

      // Find SPOF members (unique role holders)
      const roleCounts = {};
      for (const member of dept.members) {
        const role = member.title || 'Untitled';
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      }

      const singlePointsOfFailure = dept.members
        .filter((m) => roleCounts[m.title || 'Untitled'] === 1)
        .map((m) => ({
          id: m.id,
          name: `${m.first_name} ${m.last_name}`,
          title: m.title,
          risk: 'Single holder of this role',
        }));

      vulnerabilities.push({
        department: deptName,
        teamSize,
        uniqueRoles,
        busFactor: Math.round(busFactor * 100) / 100,
        vulnerabilityScore: Math.round(vulnerabilityScore),
        singlePointsOfFailure,
        recommendation: vulnerabilityScore >= 70
          ? 'Critical: Begin proactive knowledge documentation immediately'
          : vulnerabilityScore >= 40
          ? 'Recommended: Schedule quarterly knowledge capture sessions'
          : 'Low risk: Standard documentation practices sufficient',
      });
    }

    // Sort by vulnerability
    vulnerabilities.sort((a, b) => b.vulnerabilityScore - a.vulnerabilityScore);

    return {
      orgId,
      computedAt: new Date().toISOString(),
      totalEmployees: members.length,
      totalDepartments: Object.keys(departments).length,
      overallVulnerability: vulnerabilities.length > 0
        ? Math.round(vulnerabilities.reduce((s, v) => s + v.vulnerabilityScore, 0) / vulnerabilities.length)
        : 0,
      departments: vulnerabilities,
      criticalSPOFs: vulnerabilities
        .flatMap((v) => v.singlePointsOfFailure)
        .slice(0, 10),
    };
  }

  /**
   * Generate proactive knowledge capture recommendations.
   * These are actions to take BEFORE anyone resigns.
   */
  async generateProactiveRecommendations(orgId) {
    const concentrationMap = await this.computeKnowledgeConcentrationMap(orgId);
    const recommendations = [];

    // Critical SPOF recommendations
    for (const spof of concentrationMap.criticalSPOFs) {
      recommendations.push({
        type: 'proactive_capture',
        priority: 'high',
        target: spof.name,
        title: `Proactive knowledge capture for ${spof.name}`,
        description: `${spof.name} (${spof.title}) is the sole holder of their role. Schedule a knowledge mapping session to document their critical knowledge domains before any departure occurs.`,
        estimatedEffort: '2-4 hours',
        impact: 'Reduces organizational vulnerability by documenting single-point-of-failure knowledge',
      });
    }

    // Department-level recommendations
    for (const dept of concentrationMap.departments) {
      if (dept.vulnerabilityScore >= 70) {
        recommendations.push({
          type: 'department_initiative',
          priority: 'critical',
          target: dept.department,
          title: `Knowledge resilience program for ${dept.department}`,
          description: `${dept.department} has a vulnerability score of ${dept.vulnerabilityScore}/100. ${dept.singlePointsOfFailure.length} employees are single points of failure. Implement cross-training and documentation standards.`,
          estimatedEffort: '1-2 weeks',
          impact: 'Systematic reduction of knowledge concentration risk',
        });
      }
    }

    // Cross-training recommendations for small teams
    for (const dept of concentrationMap.departments) {
      if (dept.teamSize <= 3 && dept.uniqueRoles >= 2) {
        recommendations.push({
          type: 'cross_training',
          priority: 'medium',
          target: dept.department,
          title: `Cross-training program for ${dept.department}`,
          description: `Small team (${dept.teamSize} members) with ${dept.uniqueRoles} unique roles. Implement buddy system and cross-training schedule.`,
          estimatedEffort: 'Ongoing (1 hour/week)',
          impact: 'Builds redundancy in critical knowledge areas',
        });
      }
    }

    return {
      orgId,
      concentrationMap,
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
    };
  }
}

module.exports = new FlightRiskEngine();
