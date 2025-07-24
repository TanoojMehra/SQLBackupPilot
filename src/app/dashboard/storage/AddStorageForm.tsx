"use client";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Cloud, Database, Globe, HardDrive } from "lucide-react";

interface AddStorageFormProps {
  onSuccess: () => void;
}

interface StorageField {
  key: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
}

const LOCAL_BACKUP_PATH = `${typeof window === 'undefined' ? process.cwd() : ''}/public/backups`;

const STORAGE_TYPES = [
  {
    value: "LOCAL",
    label: "Local Storage",
    icon: Database,
    description: "Store backups on the local filesystem. Backups will be saved to:",
    fields: [] as StorageField[]
  },
  {
    value: "SFTP",
    label: "SFTP Server",
    icon: HardDrive,
    description: "Store backups on a remote SFTP server with secure file transfer",
    fields: [
      { key: "host", label: "Host", type: "text", placeholder: "sftp.example.com", required: true },
      { key: "port", label: "Port", type: "number", placeholder: "22", required: true },
      { key: "username", label: "Username", type: "text", placeholder: "backup-user", required: true },
      { key: "password", label: "Password", type: "password", required: true },
      { key: "remotePath", label: "Remote Path", type: "text", placeholder: "/home/backups", required: true }
    ] as StorageField[]
  },
  {
    value: "S3",
    label: "Amazon S3 (Coming Soon)",
    icon: Cloud,
    description: "Store backups in Amazon S3 bucket. Coming soon - full integration for backup upload is in development.",
    fields: [
      { key: "bucket", label: "Bucket Name", type: "text", placeholder: "my-backups", required: true },
      { key: "region", label: "Region", type: "text", placeholder: "us-east-1", required: true },
      { key: "accessKeyId", label: "Access Key ID", type: "text", required: true },
      { key: "secretAccessKey", label: "Secret Access Key", type: "password", required: true }
    ] as StorageField[]
  },
  {
    value: "GOOGLE_DRIVE",
    label: "Google Drive (Beta)",
    icon: Globe,
    description: "Store backups in Google Drive. Beta feature - requires Google Cloud API Key setup. Enter your Client ID and Client Secret below.",
    fields: [
      { key: "clientId", label: "Google Client ID", type: "text", placeholder: "Your Google Client ID", required: true },
      { key: "clientSecret", label: "Google Client Secret", type: "text", placeholder: "Your Google Client Secret", required: true },
      { key: "sharedDrive", label: "Use Shared Drive", type: "checkbox" }
    ] as StorageField[]
  },
  {
    value: "AZURE",
    label: "Azure Blob Storage (Coming Soon)",
    icon: Cloud,
    description: "Store backups in Azure Blob Storage. Coming soon - full integration for backup upload is in development.",
    fields: [
      { key: "accountName", label: "Account Name", type: "text", required: true },
      { key: "accountKey", label: "Account Key", type: "password", required: true },
      { key: "containerName", label: "Container Name", type: "text", placeholder: "backups", required: true }
    ] as StorageField[]
  }
];

function getOSInstructions() {
  const platform = typeof window !== 'undefined' ? window.navigator.platform : '';
  if (/Mac/.test(platform)) {
    return (
      <ul className="list-disc ml-5 text-xs text-blue-700 space-y-1">
        <li>If you see a permissions error, ensure the folder is not protected by System Integrity Protection or in your user’s home directory.</li>
        <li>You may need to grant Terminal or Node.js Full Disk Access in System Preferences &gt; Security &amp; Privacy.</li>
      </ul>
    );
  } else if (/Win/.test(platform)) {
    return (
      <ul className="list-disc ml-5 text-xs text-blue-700 space-y-1">
        <li>Ensure the folder is not in a protected system location (like C:\Windows).</li>
        <li>Your user must have read/write permissions to the folder.</li>
      </ul>
    );
  } else {
    return (
      <ul className="list-disc ml-5 text-xs text-blue-700 space-y-1">
        <li>Ensure the folder is owned by your user and the app has read/write permissions.</li>
      </ul>
    );
  }
}

function getGoogleRedirectUri() {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return `${window.location.origin}/api/auth/google/callback`;
  }
  return 'http://<your-server>/api/auth/google/callback';
}

export default function AddStorageForm({ onSuccess }: AddStorageFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("LOCAL");
  const [config, setConfig] = useState<Record<string, string | boolean>>(
    type === "LOCAL" ? {} : {}
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [pathCheck, setPathCheck] = useState<{ status: 'idle'|'checking'|'ok'|'error', message?: string }>({ status: 'idle' });
  const [localPathMode, setLocalPathMode] = useState<'default'|'custom'>('default');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [googleCredSaved, setGoogleCredSaved] = useState(false);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [driveFolders, setDriveFolders] = useState<{ id: string; name: string }[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState("");
  const [sftpConnectionStatus, setSftpConnectionStatus] = useState<{ status: 'idle'|'testing'|'success'|'error', message?: string }>({ status: 'idle' });
  const [sftpPaths, setSftpPaths] = useState<string[]>([]);
  const [showSftpBrowser, setShowSftpBrowser] = useState(false);

  const selectedType = STORAGE_TYPES.find(t => t.value === type);

  const handleConfigChange = (key: string, value: string | boolean) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleGoogleOAuth = async () => {
    setOauthLoading(true);
    try {
      const response = await fetch('/api/auth/google');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to get auth URL');
      const authWindow = window.open(
        data.authUrl,
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          setOauthLoading(false);
          const tokens = localStorage.getItem('google_oauth_tokens');
          if (tokens) {
            const tokenData = JSON.parse(tokens);
            setConfig(prev => ({
              ...prev,
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token,
              authenticated: true
            }));
            localStorage.removeItem('google_oauth_tokens');
          }
        }
      }, 1000);
    } catch (error) {
      setError("Failed to authenticate with Google Drive.");
      setOauthLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, config }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add storage adapter.");
      } else {
        setName("");
        setType("LOCAL");
        setConfig({});
        onSuccess();
      }
    } catch {
      setError("Server error.");
    } finally {
      setLoading(false);
    }
  };

  // Real-time path check for custom local storage
  useEffect(() => {
    if (type === "LOCAL" && config.path && config.path !== "/public/backups") {
      setPathCheck({ status: 'checking' });
      fetch(`/api/storage/check-path`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: config.path })
      })
        .then(res => res.json())
        .then(data => {
          if (data.ok) setPathCheck({ status: 'ok' });
          else setPathCheck({ status: 'error', message: data.error || 'Path not accessible' });
        })
        .catch(() => setPathCheck({ status: 'error', message: 'Path not accessible' }));
    } else {
      setPathCheck({ status: 'idle' });
    }
  }, [type, config.path]);

  // Fetch Google Drive folders after authentication
  const fetchDriveFolders = async () => {
    setDriveLoading(true);
    setDriveError("");
    try {
      const res = await fetch("/api/storage/google-drive/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: config.accessToken,
          refreshToken: config.refreshToken,
          clientId: config.clientId,
          clientSecret: config.clientSecret
        })
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.folders)) {
        setDriveFolders(data.folders);
        setShowDrivePicker(true);
      } else {
        setDriveError(data.error || "Failed to fetch folders");
      }
    } catch {
      setDriveError("Failed to fetch folders");
    }
    setDriveLoading(false);
  };

  // Test SFTP connection
  const testSftpConnection = async () => {
    setSftpConnectionStatus({ status: 'testing' });
    try {
      const res = await fetch("/api/storage/sftp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: config.host,
          port: parseInt(config.port as string) || 22,
          username: config.username,
          password: config.password
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSftpConnectionStatus({ 
          status: 'success', 
          message: `Connection successful! Working directory: ${data.workingDirectory || 'Unknown'}` 
        });
      } else {
        let errorMessage = data.error || 'Connection failed';
        if (data.installInstructions) {
          errorMessage += '\n\n' + data.installInstructions;
        }
        setSftpConnectionStatus({ status: 'error', message: errorMessage });
      }
    } catch {
      setSftpConnectionStatus({ status: 'error', message: 'Connection failed - server error' });
    }
  };

  // Browse SFTP paths
  const browseSftpPaths = async () => {
    try {
      const res = await fetch("/api/storage/sftp/browse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: config.host,
          port: parseInt(config.port as string) || 22,
          username: config.username,
          password: config.password,
          path: config.remotePath || '/'
        })
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.paths)) {
        setSftpPaths(data.paths);
        setShowSftpBrowser(true);
      }
    } catch {
      // Handle error silently
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Storage Name</label>
        <Input
          type="text"
          required
          placeholder="e.g., Production S3 Backups"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Storage Type</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {STORAGE_TYPES.map((storageType) => {
            const Icon = storageType.icon;
            return (
              <div key={storageType.value} className="col-span-1">
                <label className="flex flex-col h-full min-h-[140px] justify-between gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors w-full max-w-full">
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="storageType"
                      value={storageType.value}
                      checked={type === storageType.value}
                      onChange={(e) => {
                        setType(e.target.value);
                        setConfig({});
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{storageType.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{storageType.description}</p>
                      {storageType.value === "LOCAL" && (
                        <div className="text-xs text-blue-700 mt-1">
                          <span className="font-mono">{LOCAL_BACKUP_PATH}</span>
                        </div>
                      )}
                      {storageType.value === "S3" && (
                        <div className="text-xs text-yellow-700 mt-2">Coming soon: Full integration for backup upload</div>
                      )}
                      {storageType.value === "AZURE" && (
                        <div className="text-xs text-yellow-700 mt-2">Coming soon: Full integration for backup upload</div>
                      )}
                    </div>
                  </div>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {selectedType && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Configuration</h3>
          {type === "LOCAL" && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800 space-y-2">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="radio"
                    name="localPathMode"
                    checked={localPathMode === 'default'}
                    onChange={() => {
                      setLocalPathMode('default');
                      handleConfigChange('path', '/public/backups');
                    }}
                  />
                  <span>Default: <span className="font-mono">/public/backups</span></span>
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="radio"
                    name="localPathMode"
                    checked={localPathMode === 'custom'}
                    onChange={() => {
                      setLocalPathMode('custom');
                      handleConfigChange('path', '');
                    }}
                  />
                  <span>Custom Path:</span>
                </label>
              </div>
              {localPathMode === 'default' && (
                <div className="text-xs text-blue-700 mt-1">This is the default backup path for this project.</div>
              )}
              {localPathMode === 'custom' && (
                <>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      className="flex-1 px-2 py-1 border rounded text-xs font-mono"
                      placeholder="/absolute/path/to/folder"
                      value={config.path as string || ''}
                      onChange={e => handleConfigChange('path', e.target.value)}
                      disabled={loading}
                    />
                    <label className="inline-block cursor-pointer text-xs text-blue-700">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onClick={e => {
                          const input = e.target as HTMLInputElement;
                          input.setAttribute('webkitdirectory', '');
                          input.setAttribute('directory', '');
                        }}
                        onChange={e => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            const fullPath = (files[0] as any).webkitRelativePath || files[0].name;
                            const dir = fullPath.split("/")[0];
                            handleConfigChange('path', `/${dir}`);
                          }
                        }}
                      />
                      <span className="underline ml-1">Browse…</span>
                    </label>
                    {pathCheck.status === 'checking' && <span className="text-xs text-gray-500 ml-2">Checking…</span>}
                    {pathCheck.status === 'ok' && <span className="text-xs text-green-600 ml-2">✓ Accessible</span>}
                    {pathCheck.status === 'error' && <span className="text-xs text-red-600 ml-2">{pathCheck.message}</span>}
                  </div>
                  <div className="mt-1">{getOSInstructions()}</div>
                </>
              )}
            </div>
          )}
          {type === "GOOGLE_DRIVE" && (
            <div className="mb-2">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800 mb-2">
                <div className="text-xs text-blue-800 dark:text-blue-200 font-semibold mb-1">How to get your API Key:</div>
                <ol className="list-decimal ml-4 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                  <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                  <li>Create OAuth 2.0 Client ID credentials</li>
                  <li>Set redirect URI to <span className="font-mono">{getGoogleRedirectUri()}</span><br />
                    <span className="text-[11px] text-blue-700">(Use the exact host and port you see in your browser’s address bar, e.g. <span className="font-mono">http://192.168.1.10:2407</span> or <span className="font-mono">http://myserver.local:2407</span>)</span>
                  </li>
                  <li>Copy your Client ID and Secret here</li>
                </ol>
              </div>
            </div>
          )}
          {type === "GOOGLE_DRIVE" && (
            <div className="flex flex-col gap-2 mb-2">
              <Input
                type="text"
                placeholder="Your Google Client ID"
                value={googleClientId}
                onChange={e => {
                  setGoogleClientId(e.target.value);
                  setGoogleCredSaved(false);
                }}
                required
                disabled={!!config.authenticated}
              />
              <Input
                type="text"
                placeholder="Your Google Client Secret"
                value={googleClientSecret}
                onChange={e => {
                  setGoogleClientSecret(e.target.value);
                  setGoogleCredSaved(false);
                }}
                required
                disabled={!!config.authenticated}
              />
              {!googleCredSaved && !config.authenticated && (
                <Button
                  type="button"
                  className="w-fit"
                  disabled={!googleClientId || !googleClientSecret}
                  onClick={() => {
                    setConfig(prev => ({
                      ...prev,
                      clientId: googleClientId,
                      clientSecret: googleClientSecret
                    }));
                    setGoogleCredSaved(true);
                  }}
                >
                  Save Credentials
                </Button>
              )}
            </div>
          )}
          {type === "GOOGLE_DRIVE" && !config.authenticated && googleCredSaved && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Google Drive Authentication Required
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    Click to authenticate with your Google account
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleGoogleOAuth}
                  disabled={oauthLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {oauthLoading ? "Authenticating..." : "Connect Google Drive"}
                </Button>
              </div>
            </div>
          )}
          {type === "GOOGLE_DRIVE" && config.authenticated && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950 dark:border-green-800">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Successfully authenticated with Google Drive
                </p>
              </div>
            </div>
          )}
          {type === "GOOGLE_DRIVE" && config.authenticated && (
            <div className="mb-2">
              <Button
                type="button"
                className="w-fit mb-2"
                onClick={fetchDriveFolders}
                disabled={driveLoading}
              >
                {driveLoading ? "Loading Folders..." : "Browse Google Drive"}
              </Button>
              {driveError && <div className="text-xs text-red-600 mb-2">{driveError}</div>}
              {config.folderId && (
                <div className="text-xs text-green-700 mb-2">Selected folder: <span className="font-mono">{config.folderName || config.folderId}</span></div>
              )}
              {showDrivePicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md p-6 relative">
                    <button
                      className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      onClick={() => setShowDrivePicker(false)}
                      aria-label="Close"
                    >
                      ×
                    </button>
                    <h3 className="text-lg font-bold mb-2">Select Google Drive Folder</h3>
                    <ul className="max-h-64 overflow-y-auto divide-y">
                      {driveFolders.map(folder => (
                        <li key={folder.id}>
                          <button
                            className="w-full text-left px-2 py-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded"
                            onClick={() => {
                              setConfig(prev => ({ ...prev, folderId: folder.id, folderName: folder.name }));
                              setShowDrivePicker(false);
                            }}
                          >
                            <span className="font-mono">{folder.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
          {type === "SFTP" && config.host && config.username && config.password && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Test SFTP Connection
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    Verify connection to {config.host}:{config.port || 22}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={testSftpConnection}
                  disabled={sftpConnectionStatus.status === 'testing'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {sftpConnectionStatus.status === 'testing' ? "Testing..." : "Test Connection"}
                </Button>
              </div>
              {sftpConnectionStatus.status !== 'idle' && (
                <div className={`text-xs mt-2 ${
                  sftpConnectionStatus.status === 'success' ? 'text-green-700' :
                  sftpConnectionStatus.status === 'error' ? 'text-red-700' : 'text-blue-700'
                }`}>
                  <pre className="whitespace-pre-wrap font-sans text-xs">{sftpConnectionStatus.message}</pre>
                </div>
              )}
              {sftpConnectionStatus.status === 'success' && config.remotePath && (
                <Button
                  type="button"
                  onClick={browseSftpPaths}
                  className="mt-2 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  Browse Remote Path
                </Button>
              )}
              {showSftpBrowser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md p-6 relative">
                    <button
                      className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      onClick={() => setShowSftpBrowser(false)}
                      aria-label="Close"
                    >
                      ×
                    </button>
                    <h3 className="text-lg font-bold mb-2">Browse SFTP Path</h3>
                    <div className="text-xs text-gray-600 mb-2">Current path: {config.remotePath}</div>
                    <ul className="max-h-64 overflow-y-auto divide-y">
                      {sftpPaths.map((path, index) => (
                        <li key={index}>
                          <button
                            className="w-full text-left px-2 py-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded"
                            onClick={() => {
                              setConfig(prev => ({ ...prev, remotePath: path }));
                              setShowSftpBrowser(false);
                            }}
                          >
                            <span className="font-mono">{path}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
          {selectedType.fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <label className="block text-sm font-medium">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {field.type === "checkbox" ? (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(config[field.key])}
                    onChange={(e) => handleConfigChange(field.key, e.target.checked)}
                    disabled={loading}
                  />
                  <span className="text-sm">Enable shared drive support</span>
                </label>
              ) : (
                <Input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={String(config[field.key] || "")}
                  onChange={e => handleConfigChange(field.key, e.target.value)}
                  required={field.required}
                  disabled={loading}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <Button
          type="submit"
          disabled={loading || (type === "GOOGLE_DRIVE" && !config.authenticated)}
          className="btn-primary"
        >
          {loading ? "Adding..." : "Add Storage"}
        </Button>
      </div>
    </form>
  );
} 