; Per-user Kaizen installer. Build after build-portable.ps1 with ISCC /DMyAppVersion=x.y.z installer.iss.
#ifndef MyAppVersion
  #define MyAppVersion "1.0.0"
#endif
#define SourceDir "..\..\release-artifacts\Kaizen-" + MyAppVersion + "-win-x64"
[Setup]
AppId={{8EAD8137-91A4-41E7-9691-7031A96FF325}
AppName=Kaizen
AppVersion={#MyAppVersion}
DefaultDirName={localappdata}\Programs\Kaizen
DefaultGroupName=Kaizen
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputDir=..\..\release-artifacts
OutputBaseFilename=Kaizen-{#MyAppVersion}-win-x64-setup
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
UninstallDisplayName=Kaizen
CloseApplications=yes

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Kaizen"; Filename: "{app}\start-kaizen.cmd"; WorkingDir: "{app}"
Name: "{group}\Stop Kaizen"; Filename: "{app}\stop-kaizen.cmd"; WorkingDir: "{app}"
Name: "{group}\Verify Kaizen installation"; Filename: "{app}\verify-kaizen.cmd"; WorkingDir: "{app}"
Name: "{userdesktop}\Kaizen"; Filename: "{app}\start-kaizen.cmd"; WorkingDir: "{app}"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional shortcuts:"

[Run]
Filename: "{app}\start-kaizen.cmd"; Description: "Start Kaizen"; Flags: postinstall nowait skipifsilent

[UninstallRun]
Filename: "{app}\stop-kaizen.cmd"; Flags: runhidden waituntilterminated skipifdoesntexist
