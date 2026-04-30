import { useCallback, useMemo, useState } from 'react';

import { Pinwheel } from '@pinwheel/capacitor-sdk';
import type {
  PinwheelOpenOptions,
} from '@pinwheel/capacitor-sdk';

const defaultLinkTokenRequestBody = {
  solution: 'Deposit Switch',
  features: ['direct_deposit_switch'],
  org_name: 'test',
  end_user_id: '1f8d54a4-f5c3-4a44-9f88-68347fe8d59d',
  allocation: {
    targets: [
      {
        name: 'New account',
        type: 'checking',
        routing_number: '044002051',
        account_number: '0962447390',
      },
    ],
  },
};

type FeatureName =
  | 'direct_deposit_switch'
  | 'income'
  | 'identity'
  | 'employment'
  | 'paystubs'
  | 'paycheck_viewer';

const featureOptions: FeatureName[] = [
  'direct_deposit_switch',
  'income',
  'identity',
  'employment',
  'paystubs',
  'paycheck_viewer',
];

type AllocationAccountType = 'checking' | 'savings';

type AllocationTargetForm = {
  id: string;
  name: string;
  type: AllocationAccountType;
  account_number: string;
  routing_number: string;
};

function nowIso() {
  return new Date().toISOString();
}

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function Button(props: {
  children: string;
  variant: 'primary' | 'secondary' | 'success';
  onClick: () => void | Promise<void>;
}) {
  const className =
    props.variant === 'primary'
      ? 'inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
      : props.variant === 'success'
        ? 'inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40'
        : 'inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/30';

  return (
    <button className={className} onClick={props.onClick} type="button">
      {props.children}
    </button>
  );
}

function TextInput(props: {
  id: string;
  label: string;
  type?: 'text' | 'password';
  value: string;
  placeholder?: string;
  helperText?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={props.id} className="block text-sm font-medium text-slate-200">
        {props.label}
      </label>
      <input
        id={props.id}
        type={props.type ?? 'text'}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
      />
      {props.helperText ? (
        <p className="mt-2 text-xs text-slate-400">{props.helperText}</p>
      ) : null}
    </div>
  );
}

function Checkbox(props: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-200">
      <input
        id={props.id}
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-700 bg-slate-950"
      />
      {props.label}
    </label>
  );
}

export function App() {
  const [logLines, setLogLines] = useState<string[]>([]);
  const appendLog = useCallback((line: string) => {
    setLogLines((prev) => [`${nowIso()} ${line}`, ...prev]);
  }, []);

  const makeId = useCallback(() => Math.random().toString(36).slice(2), []);

  const pinwheelSandboxApiBaseUrl =
    (import.meta.env.VITE_PINWHEEL_API_BASE_URL as string | undefined) ?? 'https://api.getpinwheel.com/v1';

  // Link token creator state
  
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_PINWHEEL_API_KEY as string);
  const [pinwheelVersion, setPinwheelVersion] = useState('2025-07-08');
  const [orgName, setOrgName] = useState('test');
  const [solution, setSolution] = useState('Deposit Switch');
  const [endUserId, setEndUserId] = useState('1f8d54a4-f5c3-4a44-9f88-68347fe8d59d');
  const [features, setFeatures] = useState<FeatureName[]>(['direct_deposit_switch']);
  const [allocationEnabled, setAllocationEnabled] = useState(true);
  const [allocationValue, setAllocationValue] = useState('');
  const [allocationTargets, setAllocationTargets] = useState<AllocationTargetForm[]>([
    {
      id: 't0',
      name: 'New account',
      type: 'checking',
      account_number: '0962447390',
      routing_number: '044002051',
    },
  ]);
  const [useAdvancedJsonRequestBody, setUseAdvancedJsonRequestBody] = useState(false);
  const [requestBodyJson, setRequestBodyJson] = useState(
    JSON.stringify(defaultLinkTokenRequestBody, null, 2),
  );

  // Launch state
  const [token, setToken] = useState('');
  const [useDarkMode, setUseDarkMode] = useState(false);
  const [useSecureOrigin, setUseSecureOrigin] = useState(false);

  const builtRequestBodyFromForm = useMemo(() => {
    const body: Record<string, unknown> = {
      org_name: orgName.trim(),
      solution,
    };
    if (endUserId.trim()) body.end_user_id = endUserId.trim();
    if (features.length > 0) body.features = features;

    if (allocationEnabled) {
      const targets = allocationTargets
        .map((t) => ({
          name: t.name.trim(),
          type: t.type,
          account_number: t.account_number.trim(),
          routing_number: t.routing_number.trim(),
        }))
        .filter(
          (t) =>
            t.name ||
            t.account_number ||
            t.routing_number,
        );

      const parsedValue = Number.parseInt(allocationValue, 10);
      const value = Number.isFinite(parsedValue) ? parsedValue : undefined;

      if (targets.length > 0 || value !== undefined) {
        body.allocation = {
          ...(targets.length > 0 ? { targets } : {}),
          ...(value !== undefined ? { value } : {}),
        };
      }
    }

    return body;
  }, [
    allocationEnabled,
    allocationTargets,
    allocationValue,
    endUserId,
    features,
    orgName,
    solution,
  ]);

  const onBuildJson = useCallback(() => {
    setRequestBodyJson(JSON.stringify(builtRequestBodyFromForm, null, 2));
    appendLog('[link_token] built request body JSON');
  }, [appendLog, builtRequestBodyFromForm]);

  const onLoadJson = useCallback(() => {
    const raw = requestBodyJson.trim();
    if (!raw) {
      setRequestBodyJson(JSON.stringify(defaultLinkTokenRequestBody, null, 2));
      appendLog('[link_token] loaded default request body JSON');
      return;
    }
    try {
      const obj = JSON.parse(raw);
      setRequestBodyJson(JSON.stringify(obj, null, 2));
      appendLog('[link_token] JSON parsed OK');
    } catch (e) {
      appendLog(`[link_token] invalid JSON: ${String((e as Error)?.message || e)}`);
    }
  }, [appendLog, requestBodyJson]);

  // NOTE: This is pattern is not recommended for production use.
  // API keys should be stored in a secure way and used server side to
  // generate link tokens.
  const onCreateToken = useCallback(async () => {
    if (!apiKey.trim()) {
      appendLog('[link_token] missing API key');
      return;
    }

    let requestBody: unknown;
    if (useAdvancedJsonRequestBody) {
      try {
        requestBody = JSON.parse(requestBodyJson || '{}');
      } catch (e) {
        appendLog(
          `[link_token] invalid request body JSON: ${String((e as Error)?.message || e)}`,
        );
        return;
      }
    } else {
      requestBody = builtRequestBodyFromForm;
    }

    
    appendLog(
      `[link_token] creating token via ${pinwheelSandboxApiBaseUrl}/link_tokens upstream=${pinwheelSandboxApiBaseUrl} Pinwheel-Version=${pinwheelVersion}`,
    );

    let resp: Response;
    try {
      resp = await fetch(`${pinwheelSandboxApiBaseUrl}/link_tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-SECRET': apiKey.trim(),
          'Pinwheel-Version': pinwheelVersion.trim(),
        },
        body: JSON.stringify(requestBody),
      });
    } catch (e) {
      appendLog(`[link_token] request failed: ${String((e as Error)?.message || e)}`);
      return;
    }

    const text = await resp.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    appendLog(`[link_token] response status=${resp.status} body=${safeStringify(json)}`);

    const createdToken = json?.data?.token ?? json?.token;
    if (typeof createdToken === 'string' && createdToken.trim()) {
      setToken(createdToken);
      appendLog(`[link_token] token copied into launch input (len=${createdToken.length})`);
    } else if (typeof createdToken === 'number' && Number.isFinite(createdToken)) {
      // If upstream ever returns a numeric token-like value, coerce for visibility.
      // (Most Pinwheel Link tokens are strings.)
      const coerced = String(createdToken);
      setToken(coerced);
      appendLog(`[link_token] token was number; coerced to string (value=${coerced})`);
    } else {
      appendLog(
        `[link_token] did not find token in response (data.token). got=${safeStringify(createdToken)}`,
      );
    }
  }, [
    apiKey,
    appendLog,
    builtRequestBodyFromForm,
    pinwheelVersion,
    pinwheelSandboxApiBaseUrl,
    requestBodyJson,
    useAdvancedJsonRequestBody,
  ]);

  const onCopyToken = useCallback(async () => {
    if (!token) {
      appendLog('[link_token] no token to copy');
      return;
    }
    await navigator.clipboard.writeText(token);
    appendLog('[link_token] copied token to clipboard');
  }, [appendLog, token]);

  const onOpen = useCallback(async () => {
    if (!token || typeof token !== 'string' || token.trim().length < 16) {
      appendLog(
        `[open] token looks invalid (len=${token ? String(token).length : 0}). Paste a link token from /v1/link_tokens.`,
      );
      return;
    }
    const options: PinwheelOpenOptions = {
      linkToken: token,
      useDarkMode,
      useSecureOrigin,
    };
    appendLog(`[open] useDarkMode=${useDarkMode} useSecureOrigin=${useSecureOrigin}`);
    try {
      await Pinwheel.open(options);
      appendLog('[open] native modal presented');
    } catch (e) {
      appendLog(`[open] failed: ${String((e as Error)?.message || e)}`);
    }
  }, [appendLog, token, useDarkMode, useSecureOrigin]);

  const onClose = useCallback(async () => {
    appendLog('[close]');
    await Pinwheel.close();
  }, [appendLog]);

  const onClearLog = useCallback(() => setLogLines([]), []);


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      <main className="mx-auto max-w-3xl px-5 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Pinwheel Capacitor SDK (@pinwheel/capacitor-sdk)</h1>
          <p className="mt-2 text-sm text-slate-300">
            This example app is intended for{' '}
            <span className="font-medium text-slate-200">production</span> testing and event
            parity validation.
          </p>
        </div>

        <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-100">Create Link Token (production)</h2>
            <span className="text-xs text-slate-400">POST /v1/link_tokens</span>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-1">
              <TextInput
                id="apiKeyInput"
                label="API key (production)"
                type="password"
                value={apiKey}
                placeholder="Paste a production API key"
                helperText="Stored only in memory in this page."
                onChange={setApiKey}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="block text-sm font-medium text-slate-200">Pinwheel API (fixed)</div>
                <div className="mt-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                  {pinwheelSandboxApiBaseUrl}
                </div>
              </div>
              <TextInput
                id="orgNameInput"
                label="org_name"
                value={orgName}
                onChange={setOrgName}
              />
              <div>
                <label htmlFor="solutionSelect" className="block text-sm font-medium text-slate-200">
                  solution
                </label>
                <select
                  id="solutionSelect"
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  {['Deposit Switch', 'Verify', 'Paycheck Viewer', 'Bill Switch', 'Bill Manager', 'Switch Kit'].map(
                    (s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput
                id="endUserIdInput"
                label="end_user_id"
                value={endUserId}
                helperText="Required unless you provide account_id."
                onChange={setEndUserId}
              />
              <TextInput
                id="pinwheelVersionInput"
                label="Pinwheel-Version header"
                value={pinwheelVersion}
                onChange={setPinwheelVersion}
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-medium text-slate-200">features</div>
              <div className="grid gap-2 sm:grid-cols-3">
                {featureOptions.map((f) => (
                  <Checkbox
                    key={f}
                    id={`feature_${f}`}
                    label={f}
                    checked={features.includes(f)}
                    onChange={(checked) => {
                      setFeatures((prev) =>
                        checked ? Array.from(new Set([...prev, f])) : prev.filter((x) => x !== f),
                      );
                    }}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Per the API schema, <code className="text-slate-300">features</code> is required
                unless you set <code className="text-slate-300">account_id</code>.
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-slate-200">allocation (optional)</div>
                <Checkbox
                  id="allocationEnabled"
                  label="include"
                  checked={allocationEnabled}
                  onChange={(checked) => setAllocationEnabled(checked)}
                />
              </div>

              {allocationEnabled ? (
                <div className="mt-4 grid gap-4">
                  <TextInput
                    id="allocationValue"
                    label="allocation.value"
                    value={allocationValue}
                    placeholder="900"
                    helperText="Integer value forwarded to Pinwheel. (Example from RN: 900)"
                    onChange={setAllocationValue}
                  />

                  <div>
                    <div className="mb-2 text-sm font-medium text-slate-200">
                      allocation.targets
                    </div>
                    <div className="grid gap-3">
                      {allocationTargets.map((t, idx) => (
                        <div
                          key={t.id}
                          className="rounded-lg border border-slate-800 bg-slate-950/40 p-4"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <div className="text-xs font-medium text-slate-300">
                              target {idx + 1}
                            </div>
                            <button
                              type="button"
                              className="text-xs text-slate-300 hover:text-slate-100"
                              onClick={() =>
                                setAllocationTargets((prev) =>
                                  prev.length <= 1 ? prev : prev.filter((x) => x.id !== t.id),
                                )
                              }
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <TextInput
                              id={`allocationTargetName_${t.id}`}
                              label="name"
                              value={t.name}
                              onChange={(value) =>
                                setAllocationTargets((prev) =>
                                  prev.map((x) => (x.id === t.id ? { ...x, name: value } : x)),
                                )
                              }
                            />

                            <div>
                              <label
                                htmlFor={`allocationTargetType_${t.id}`}
                                className="block text-sm font-medium text-slate-200"
                              >
                                type
                              </label>
                              <select
                                id={`allocationTargetType_${t.id}`}
                                value={t.type}
                                onChange={(e) =>
                                  setAllocationTargets((prev) =>
                                    prev.map((x) =>
                                      x.id === t.id
                                        ? { ...x, type: e.target.value as AllocationAccountType }
                                        : x,
                                    ),
                                  )
                                }
                                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                              >
                                <option value="checking">checking</option>
                                <option value="savings">savings</option>
                              </select>
                            </div>

                            <TextInput
                              id={`allocationTargetAccount_${t.id}`}
                              label="account_number"
                              value={t.account_number}
                              onChange={(value) =>
                                setAllocationTargets((prev) =>
                                  prev.map((x) =>
                                    x.id === t.id ? { ...x, account_number: value } : x,
                                  ),
                                )
                              }
                            />

                            <TextInput
                              id={`allocationTargetRouting_${t.id}`}
                              label="routing_number"
                              value={t.routing_number}
                              onChange={(value) =>
                                setAllocationTargets((prev) =>
                                  prev.map((x) =>
                                    x.id === t.id ? { ...x, routing_number: value } : x,
                                  ),
                                )
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3">
                      <button
                        type="button"
                        className="text-sm text-slate-200 hover:text-slate-50"
                        onClick={() =>
                          setAllocationTargets((prev) => [
                            ...prev,
                            {
                              id: makeId(),
                              name: '',
                              type: 'checking',
                              account_number: '',
                              routing_number: '',
                            },
                          ])
                        }
                      >
                        + Add target
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div>
              <label htmlFor="requestBodyJson" className="block text-sm font-medium text-slate-200">
                Request body (JSON)
              </label>
              <div className="mt-2">
                <Checkbox
                  id="useAdvancedJsonRequestBody"
                  label="Use JSON editor as the request body (advanced)"
                  checked={useAdvancedJsonRequestBody}
                  onChange={setUseAdvancedJsonRequestBody}
                />
              </div>
              <textarea
                id="requestBodyJson"
                rows={8}
                spellCheck={false}
                value={
                  useAdvancedJsonRequestBody
                    ? requestBodyJson
                    : JSON.stringify(builtRequestBodyFromForm, null, 2)
                }
                readOnly={!useAdvancedJsonRequestBody}
                onChange={(e) => setRequestBodyJson(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              <p className="mt-2 text-xs text-slate-400">
                {useAdvancedJsonRequestBody
                  ? 'You can edit this directly; click “Load JSON” to normalize formatting.'
                  : 'This is the request body generated from the form. Enable advanced mode to edit JSON directly.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="success" onClick={onCreateToken}>
                Create token
              </Button>
              {useAdvancedJsonRequestBody ? (
                <>
                  <Button variant="secondary" onClick={onBuildJson}>
                    Build JSON
                  </Button>
                  <Button variant="secondary" onClick={onLoadJson}>
                    Load JSON
                  </Button>
                </>
              ) : null}
              <Button variant="secondary" onClick={onCopyToken}>
                Copy token to clipboard
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm">
          <div className="grid gap-4">
            <TextInput
              id="tokenInput"
              label="Link token (production)"
              value={token}
              placeholder="Paste a production link token"
              helperText="Tip: sandbox vs production is determined by the token you paste."
              onChange={setToken}
            />

            <div className="grid gap-2 sm:grid-cols-2">
              <Checkbox id="useDarkMode" label="useDarkMode" checked={useDarkMode} onChange={setUseDarkMode} />
              <Checkbox
                id="useSecureOrigin"
                label="useSecureOrigin"
                checked={useSecureOrigin}
                onChange={setUseSecureOrigin}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={onOpen}>
                Open
              </Button>
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
              <Button variant="secondary" onClick={onClearLog}>
                Clear log
              </Button>
            </div>

            <div>
              <label htmlFor="eventLog" className="block text-sm font-medium text-slate-200">
                Event log
              </label>
              <textarea
                id="eventLog"
                rows={14}
                readOnly
                value={logLines.join('\n')}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                placeholder="Events will appear here…"
              />
            </div>
          </div>
        </section>


      </main>
    </div>
  );
}

