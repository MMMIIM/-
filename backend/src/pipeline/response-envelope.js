export function createResponseEnvelope({ title, requirements, sections, traceability, validation, audit, providerAudit }) {
  const markdown = sections
    .filter((section) => typeof section.final_text === 'string')
    .map((section) => `## ${section.title}\n\n${section.final_text}`)
    .join('\n\n');
  const validationWarnings = validation.warnings.map((warning) => ({ level: 'warning', ...warning }));
  const validationErrors = validation.errors.map((error) => ({ level: 'critical', ...error }));

  return {
    schema_version: '4.3',
    requirements: requirements.map((requirement) => ({ ...requirement, target_sections: [...requirement.target_sections] })),
    document: {
      title,
      markdown,
      sections: sections.map((section) => ({
        id: section.id,
        title: section.title,
        requirement_ids: [...section.requirement_ids],
        final_text: typeof section.final_text === 'string' ? section.final_text : '',
        requiresManualOrLlmRevision: Boolean(section.requiresManualOrLlmRevision)
      }))
    },
    traceability_matrix: traceability,
    warnings: [...validationWarnings, ...validationErrors],
    risk_status: validation.risk_status,
    generation_audit: audit,
    ...(providerAudit ? { provider_audit: providerAudit } : {})
  };
}
