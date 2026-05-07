/**
 * Plan-aligned name for platform email broadcasts (DB table: platform_broadcasts).
 */
export {
  listBroadcasts as listAnnouncements,
  createBroadcastDraft as createAnnouncementDraft,
  sendBroadcastEmails as sendAnnouncementEmails,
  type PlatformBroadcastRow as PlatformAnnouncementRow,
} from './platformBroadcastsService';
