; Builds one per-user installer executable with Start Menu, desktop, verification and uninstall entries.
#ifndef MyAppVersion
  #define MyAppVersion "1.0.0"
#endif
#define SourceDir "..\..\release-artifacts\Kaizen-" + MyAppVersion + "-win-x64"
[Setup]
AppId={{8EAD8137-91A4-41E7-9691-7031A96FF325}
AppName=Kaizen
AppPublisher=Kaizen
AppVersion={#MyAppVersion}
DefaultDirName={localappdata}\Programs\Kaizen
UsePreviousAppDir=yes
DefaultGroupName=Kaizen
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputDir=..\..\release-artifacts
OutputBaseFilename=Kaizen-{#MyAppVersion}-win-x64-setup
SetupIconFile=assets\kaizen.ico
UninstallDisplayIcon={app}\assets\kaizen.ico
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
UninstallDisplayName=Kaizen
LicenseFile=..\..\LICENSE
CloseApplications=yes

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Kaizen"; Filename: "{app}\desktop\electron.exe"; Parameters: """{app}\desktop\main.cjs"""; WorkingDir: "{app}"; IconFilename: "{app}\assets\kaizen.ico"
Name: "{group}\Stop Kaizen"; Filename: "{app}\stop-kaizen.cmd"; WorkingDir: "{app}"; IconFilename: "{app}\assets\kaizen.ico"
Name: "{group}\Verify Kaizen installation"; Filename: "{app}\verify-kaizen.cmd"; WorkingDir: "{app}"; IconFilename: "{app}\assets\kaizen.ico"
Name: "{group}\Uninstall Kaizen"; Filename: "{uninstallexe}"; IconFilename: "{app}\assets\kaizen.ico"
Name: "{userdesktop}\Kaizen"; Filename: "{app}\desktop\electron.exe"; Parameters: """{app}\desktop\main.cjs"""; WorkingDir: "{app}"; IconFilename: "{app}\assets\kaizen.ico"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a Kaizen desktop shortcut"; GroupDescription: "Additional shortcuts:"

[Run]
Filename: "{app}\desktop\electron.exe"; Parameters: """{app}\desktop\main.cjs"""; Description: "Launch Kaizen"; Flags: postinstall nowait skipifsilent

[UninstallRun]
Filename: "{app}\stop-kaizen.cmd"; Flags: runhidden waituntilterminated skipifdoesntexist

[Code]
function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ResultCode: Integer;
begin
  Result := '';
  if FileExists(ExpandConstant('{app}\stop-kaizen.cmd')) then
    Exec(ExpandConstant('{app}\stop-kaizen.cmd'), '', ExpandConstant('{app}'), SW_HIDE, ewWaitUntilTerminated, ResultCode);
end;
