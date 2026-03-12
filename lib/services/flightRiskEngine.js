import { db } from '../db';

export async function computeKnowledgeConcentrationMap(orgId) {
  const members = await db('users')
    .where({ org_id: orgId, is_active: true })
    .select('id', 'first_name', 'last_name', 'title', 'department');

  const departments = {};
  for (const member of members) {
    const dept = member.department || 'Unknown';
    if (!departments[dept]) departments[dept] = { members: [], uniqueRoles: new Set() };
    departments[dept].members.push(member);
    if (member.title) departments[dept].uniqueRoles.add(member.title);
  }

  const vulnerabilities = [];
  for (const [deptName, dept] of Object.entries(departments)) {
    const teamSize = dept.members.length;
    const uniqueRoles = dept.uniqueRoles.size;
    const busFactor = uniqueRoles / Math.max(teamSize, 1);
    const vulnerabilityScore = Math.min(100, busFactor * 60 + (teamSize <= 3 ? 30 : 0));

    const roleCounts = {};
    for (const member of dept.members) {
      const role = member.title || 'Untitled';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    }

    const singlePointsOfFailure = dept.members
      .filter((m) => roleCounts[m.title || 'Untitled'] === 1)
      .map((m) => ({ id: m.id, name: `${m.first_name} ${m.last_name}`, title: m.title, risk: 'Single holder of this role' }));

    vulnerabilities.push({
      department: deptName, teamSize, uniqueRoles, busFactor: Math.round(busFactor * 100) / 100,
      vulnerabilityScore: Math.round(vulnerabilityScore), singlePointsOfFailure,
      recommendation: vulnerabilityScore >= 70
        ? 'Critical: Begin proactive knowledge documentation immediately'
        : vulnerabilityScore >= 40 ? 'Recommended: Schedule quarterly knowledge capture sessions'
        : 'Low risk: Standard documentation practices sufficient',
    });
  }

  vulnerabilities.sort((a, b) => b.vulnerabilityScore - a.vulnerabilityScore);

  return {
    orgId, computedAt: new Date().toISOString(), totalEmployees: members.length,
    totalDepartments: Object.keys(departments).length,
    overallVulnerability: vulnerabilities.length > 0
      ? Math.round(vulnerabilities.reduce((s, v) => s + v.vulnerabilityScore, 0) / vulnerabilities.length) : 0,
    departments: vulnerabilities,
    criticalSPOFs: vulnerabilities.flatMap((v) => v.singlePointsOfFailure).slice(0, 10),
  };
}

export async function generateProactiveRecommendations(orgId) {
  const concentrationMap = await computeKnowledgeConcentrationMap(orgId);
  const recommendations = [];

  for (const spof of concentrationMap.criticalSPOFs) {
    recommendations.push({
      type: 'proactive_capture', priority: 'high', target: spof.name,
      title: `Proactive knowledge capture for ${spof.name}`,
      description: `${spof.name} (${spof.title}) is the sole holder of their role. Schedule a knowledge mapping session.`,
      estimatedEffort: '2-4 hours',
    });
  }

  for (const dept of concentrationMap.departments) {
    if (dept.vulnerabilityScore >= 70) {
      recommendations.push({
        type: 'department_initiative', priority: 'critical', target: dept.department,
        title: `Knowledge resilience program for ${dept.department}`,
        description: `${dept.department} has a vulnerability score of ${dept.vulnerabilityScore}/100. ${dept.singlePointsOfFailure.length} employees are single points of failure.`,
        estimatedEffort: '1-2 weeks',
      });
    }
  }

  return {
    orgId, concentrationMap,
    recommendations: recommendations.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority];
    }),
  };
}
