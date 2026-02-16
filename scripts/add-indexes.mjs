import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const indexes = [
  // property_views — high volume table, needs propertyId + viewedAt indexes
  `CREATE INDEX idx_pv_property ON property_views (propertyId)`,
  `CREATE INDEX idx_pv_viewed ON property_views (viewedAt)`,
  `CREATE INDEX idx_pv_property_viewed ON property_views (propertyId, viewedAt)`,

  // activity_logs — queried by userId, category, createdAt
  `CREATE INDEX idx_al_user ON activity_logs (userId)`,
  `CREATE INDEX idx_al_category ON activity_logs (activityCategory)`,
  `CREATE INDEX idx_al_created ON activity_logs (activityCreatedAt)`,
  `CREATE INDEX idx_al_user_category ON activity_logs (userId, activityCategory)`,

  // customer_favorites — queried by customerId + propertyId
  `CREATE INDEX idx_cf_customer ON customer_favorites (customerId)`,
  `CREATE INDEX idx_cf_property ON customer_favorites (favoritePropertyId)`,
  `CREATE UNIQUE INDEX idx_cf_customer_property ON customer_favorites (customerId, favoritePropertyId)`,

  // property_amenities — junction table, needs both FK indexes
  `CREATE INDEX idx_pa_property ON property_amenities (propertyId)`,
  `CREATE INDEX idx_pa_amenity ON property_amenities (amenityId)`,
  `CREATE UNIQUE INDEX idx_pa_property_amenity ON property_amenities (propertyId, amenityId)`,

  // otp_codes — queried by phone + purpose + expiry
  `CREATE INDEX idx_otp_phone ON otp_codes (otpPhone)`,
  `CREATE INDEX idx_otp_phone_purpose ON otp_codes (otpPhone, otpPurpose, isUsed)`,
  `CREATE INDEX idx_otp_expires ON otp_codes (otpExpiresAt)`,

  // financing_requests — queried by status, createdAt
  `CREATE INDEX idx_fr_status ON financing_requests (financingStatus)`,
  `CREATE INDEX idx_fr_created ON financing_requests (financingCreatedAt)`,
  `CREATE INDEX idx_fr_status_created ON financing_requests (financingStatus, financingCreatedAt)`,

  // properties — add price index for sorting and range queries
  `CREATE INDEX idx_properties_price ON properties (price)`,
  // properties — add agencyId and agentId for joins
  `CREATE INDEX idx_properties_agency ON properties (agencyId)`,
  `CREATE INDEX idx_properties_agent ON properties (agentId)`,
  // properties — composite for common search: status + listingType + city + price
  `CREATE INDEX idx_properties_search ON properties (propertyStatus, listingType, city, price)`,
  // properties — viewCount for popular sorting
  `CREATE INDEX idx_properties_views ON properties (viewCount)`,

  // customer_sessions — queried by customerId + tokenHash
  `CREATE INDEX idx_cs_customer ON customer_sessions (sessionCustomerId)`,
  `CREATE INDEX idx_cs_token ON customer_sessions (customerTokenHash)`,
  `CREATE INDEX idx_cs_expires ON customer_sessions (customerSessionExpiresAt)`,

  // user_sessions — queried by userId + tokenHash
  `CREATE INDEX idx_us_user ON user_sessions (userId)`,
  `CREATE INDEX idx_us_token ON user_sessions (tokenHash)`,

  // notifications — composite for user + read status
  `CREATE INDEX idx_notif_user_read ON notifications (userId, isRead, createdAt)`,

  // messages — composite for recipient inbox
  `CREATE INDEX idx_msg_recipient_read ON messages (recipientId, isRead, createdAt)`,

  // agencies — slug for lookups
  `CREATE INDEX idx_agency_slug ON agencies (agencySlug)`,
  `CREATE INDEX idx_agency_status ON agencies (agencyStatus)`,

  // agents — agencyId for joins
  `CREATE INDEX idx_agent_agency ON agents (agentAgencyId)`,

  // districts — cityId for joins
  `CREATE INDEX idx_district_city ON districts (cityId)`,
];

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const sql of indexes) {
    try {
      await conn.query(sql);
      console.log(`✓ ${sql.substring(0, 80)}...`);
      success++;
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME' || e.message.includes('Duplicate key name')) {
        console.log(`⊘ SKIP (exists): ${sql.substring(0, 60)}...`);
        skipped++;
      } else {
        console.log(`✗ FAIL: ${sql.substring(0, 60)}... → ${e.message}`);
        failed++;
      }
    }
  }

  console.log(`\nDone: ${success} created, ${skipped} skipped, ${failed} failed`);
  await conn.end();
}

main().catch(console.error);
