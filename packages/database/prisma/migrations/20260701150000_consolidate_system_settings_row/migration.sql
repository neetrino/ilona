-- Consolidate duplicate system_settings rows into a single canonical row (id = 'default')

DO $$
DECLARE
  source RECORD;
BEGIN
  SELECT *
  INTO source
  FROM system_settings
  ORDER BY "updatedAt" DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM system_settings WHERE id = 'default') THEN
    UPDATE system_settings
    SET
      "vocabDeductionPercent" = source."vocabDeductionPercent",
      "feedbackDeductionPercent" = source."feedbackDeductionPercent",
      "maxUnjustifiedAbsences" = source."maxUnjustifiedAbsences",
      "paymentDueDays" = source."paymentDueDays",
      "lessonReminderHours" = source."lessonReminderHours",
      "logoUrl" = COALESCE(source."logoUrl", system_settings."logoUrl"),
      "dashboardBannerUrl" = COALESCE(source."dashboardBannerUrl", system_settings."dashboardBannerUrl"),
      "dashboardBannerTitle" = COALESCE(source."dashboardBannerTitle", system_settings."dashboardBannerTitle"),
      "dashboardBannerSubtitle" = COALESCE(source."dashboardBannerSubtitle", system_settings."dashboardBannerSubtitle"),
      "penaltyAbsenceAmd" = source."penaltyAbsenceAmd",
      "penaltyFeedbackAmd" = source."penaltyFeedbackAmd",
      "penaltyVoiceAmd" = source."penaltyVoiceAmd",
      "penaltyTextAmd" = source."penaltyTextAmd",
      "penaltyDailyPlanAmd" = source."penaltyDailyPlanAmd",
      "footerIconLinks" = COALESCE(source."footerIconLinks", system_settings."footerIconLinks"),
      "updatedAt" = NOW()
    WHERE id = 'default';
  ELSE
    INSERT INTO system_settings (
      id,
      "vocabDeductionPercent",
      "feedbackDeductionPercent",
      "maxUnjustifiedAbsences",
      "paymentDueDays",
      "lessonReminderHours",
      "logoUrl",
      "dashboardBannerUrl",
      "dashboardBannerTitle",
      "dashboardBannerSubtitle",
      "penaltyAbsenceAmd",
      "penaltyFeedbackAmd",
      "penaltyVoiceAmd",
      "penaltyTextAmd",
      "penaltyDailyPlanAmd",
      "footerIconLinks",
      "updatedAt"
    )
    VALUES (
      'default',
      source."vocabDeductionPercent",
      source."feedbackDeductionPercent",
      source."maxUnjustifiedAbsences",
      source."paymentDueDays",
      source."lessonReminderHours",
      source."logoUrl",
      source."dashboardBannerUrl",
      source."dashboardBannerTitle",
      source."dashboardBannerSubtitle",
      source."penaltyAbsenceAmd",
      source."penaltyFeedbackAmd",
      source."penaltyVoiceAmd",
      source."penaltyTextAmd",
      source."penaltyDailyPlanAmd",
      source."footerIconLinks",
      NOW()
    );
  END IF;

  DELETE FROM system_settings WHERE id <> 'default';
END $$;
