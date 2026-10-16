// Only call after the brand parser has matched the release title, product name and article body.
export function officialAnnouncementEvidence(name:string,sourceUrl:string,announcedDate:string) {
  return {sourceUrl,checkedAt:new Date().toISOString(),robots:"not_provided" as const,
    officialLaunchAnnouncement:true,announcementProductName:name,officialDate:announcedDate,dateKind:"announcement" as const};
}
