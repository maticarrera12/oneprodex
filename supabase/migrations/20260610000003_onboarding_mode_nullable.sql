-- onboarding_mode should be NULL for new users so they always see the mode selector
ALTER TABLE users ALTER COLUMN onboarding_mode DROP DEFAULT;
ALTER TABLE users ALTER COLUMN onboarding_mode DROP NOT NULL;
