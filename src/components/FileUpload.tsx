import { UI_STRINGS } from "../constants/strings";

type FileUploadProps = {
  onFileSelected: (file: File) => void;
  onLoadMock: () => void;
  loading: boolean;
};

export function FileUpload({
  onFileSelected,
  onLoadMock,
  loading
}: FileUploadProps): JSX.Element {
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-slate-900">Start With Your Statement</h2>
        <p className="text-sm text-slate-600">
          Upload one statement file to generate insights, trends, and merchant-level spend
          breakdown instantly.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="inline-flex cursor-pointer items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          {loading ? "Parsing..." : UI_STRINGS.upload}
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onFileSelected(file);
              }
              event.target.value = "";
            }}
            disabled={loading}
          />
        </label>
        <button
          type="button"
          onClick={onLoadMock}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
        >
          {UI_STRINGS.loadMockData}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Supported: PDF only. Files are parsed in-memory and never uploaded.
      </p>
    </section>
  );
}
