import { getExpenseCategories, getGlobalSettings } from "./actions";
import { CategorySettingsClient } from "./category-settings-client";
import { GeneralSettings } from "./general-settings";

export default async function SettingsPage() {
  const [categories, settings] = await Promise.all([
    getExpenseCategories(),
    getGlobalSettings(),
  ]);

  return (
    <div className="grid gap-6">
      <GeneralSettings settings={settings} />
      <CategorySettingsClient initialCategories={categories} />
    </div>
  );
}
