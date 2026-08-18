export function buildTraceabilityMatrix(requirements, sections) {
  return requirements.map((requirement) => {
    const matchedSections = sections.filter((section) => (
      typeof section.final_text === 'string'
      && section.final_text.trim()
      && Array.isArray(section.requirement_ids)
      && section.requirement_ids.includes(requirement.req_id)
      && requirement.target_sections.includes(section.id)
    ));
    return {
      req_id: requirement.req_id,
      is_mandatory: requirement.is_mandatory,
      mandatory_marker: requirement.mandatory_marker,
      target_sections: [...requirement.target_sections],
      section_ids: matchedSections.map((section) => section.id),
      status: matchedSections.length ? 'covered' : 'uncovered'
    };
  });
}
