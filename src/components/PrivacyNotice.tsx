import { UI_STRINGS } from "../constants/strings";

export function PrivacyNotice(): JSX.Element {
  return (
    <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
      <p className="font-semibold">Privacy and security promise</p>
      <p className="mt-1">{UI_STRINGS.privacyNotice}</p>
      <p className="mt-1 text-xs text-emerald-800">
        This app runs locally in your browser, so your statement is not sent to any server.
      </p>
    </div>
  );
}
