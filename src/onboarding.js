export function createOnboardingDraft(profile={}){return{
  assessorName:profile.assessorName??profile.name??'',providerName:profile.providerName??'',
  providerLogo:profile.providerLogo??null,signatureSaved:!!(profile.signatureSaved||profile.signatureDataUrl),
  signatureSkipped:!!profile.signatureSkipped,storageAccepted:!!profile.storageAccepted
}}
export function profileFromDraft(profile,draft){return{...profile,name:draft.assessorName,assessorName:draft.assessorName,
  providerName:draft.providerName,providerLogo:draft.providerLogo,signatureSaved:draft.signatureSaved,
  signatureSkipped:draft.signatureSkipped,storageAccepted:draft.storageAccepted,onboardingComplete:true}}
