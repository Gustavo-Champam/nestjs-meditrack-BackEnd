export interface UpdatePreferencesDto {
  timezone?: string;
  locale?: string;
  timeFormat?: string;
  units?: string;
  accessibility?: any[];
  notificationSettings?: any[];
}