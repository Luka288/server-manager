export const script = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = "Select Minecraft server folder"
$dialog.ShowNewFolderButton = $true

# Create an invisible, TopMost owner window so the dialog inherits topmost behavior
$owner = New-Object System.Windows.Forms.Form
$owner.StartPosition = 'CenterScreen'
$owner.Size = New-Object System.Drawing.Size(0,0)
$owner.ShowInTaskbar = $false
$owner.TopMost = $true
$owner.Opacity = 0
$owner.Show()
$owner.Activate()
$owner.Focus()

$result = $dialog.ShowDialog($owner)

$owner.Close()
$owner.Dispose()

if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
    Write-Output $dialog.SelectedPath
}
`;
