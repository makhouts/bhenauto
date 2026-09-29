-- Analytics has been removed from the application. This deletes historical events.
DROP TABLE IF EXISTS "AnalyticsEvent";
DROP TYPE IF EXISTS "AnalyticsEventType";
