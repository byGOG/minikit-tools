type AdvertisingConfig = {
  publisherId: string; enabled: boolean; siteApproved: boolean;
  googleCmpPublished: boolean; topSlot: string; bottomSlot: string;
};
export function validateAdvertising(config: AdvertisingConfig) {
  if (config.publisherId && !/^ca-pub-\d{16}$/.test(config.publisherId)) {
    throw new Error('Use the real AdSense publisher ID: ca-pub- followed by 16 digits.');
  }
  for (const slot of [config.topSlot, config.bottomSlot]) {
    if (slot && !/^\d{10}$/.test(slot)) throw new Error('AdSense ad unit IDs must contain 10 digits.');
  }
  if (config.enabled && (!config.publisherId || !config.siteApproved || !config.googleCmpPublished || !config.topSlot || !config.bottomSlot)) {
    throw new Error('Advertising requires a publisher ID, two ad units, site approval and a published Google CMP message.');
  }
  return config;
}
