# Source before Rust work: . .\scripts\env-rust-x.ps1
$env:RUSTUP_HOME = "X:\REPOZ\.rustup"
$env:CARGO_HOME = "X:\REPOZ\.cargo"
$toolchainBin = "X:\REPOZ\.rustup\toolchains\stable-x86_64-pc-windows-msvc\bin"
if (Test-Path $toolchainBin) {
    $env:PATH = "$toolchainBin;$env:CARGO_HOME\bin;$env:PATH"
}
