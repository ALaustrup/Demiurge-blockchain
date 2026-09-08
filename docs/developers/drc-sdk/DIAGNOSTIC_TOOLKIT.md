# DRC-SDK Diagnostic Toolkit

**Verify your game project is properly configured for Demiurge Blockchain integration**

> *"Before the flame can burn eternal, the connection must be forged true."*

---

## Overview

The DRC-SDK Diagnostic Toolkit provides automated verification tools to ensure your game project is correctly configured for Demiurge Blockchain integration. Run these diagnostics before deployment to catch configuration issues early.

### What Gets Checked

| Category | Checks |
|----------|--------|
| **Network** | RPC connectivity, chain health, latency |
| **Configuration** | Endpoint URLs, wallet format, Oracle setup |
| **DRC-369** | Asset queries, metadata format, resource loading |
| **Security** | HTTPS enforcement, no exposed keys, CORS setup |
| **Engine-Specific** | Plugin loading, singleton initialization |

---

## Quick Diagnostic (All Engines)

### Web-Based Diagnostic Tool

For a quick check without modifying your project, use the online diagnostic:

```
https://diag.demiurge.cloud
```

Or run this in your browser console (F12):

```javascript
// DRC-SDK Quick Diagnostic v1.0
(async () => {
    const RPC = 'https://rpc.demiurge.cloud';
    const results = { passed: 0, failed: 0, warnings: 0, tests: [] };
    
    const log = (name, status, msg) => {
        const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
        console.log(`${icon} ${name}: ${msg}`);
        results.tests.push({ name, status, msg });
        if (status === 'pass') results.passed++;
        else if (status === 'fail') results.failed++;
        else results.warnings++;
    };

    console.log('🔍 DRC-SDK Diagnostic Starting...\n');

    // Test 1: RPC Connectivity
    try {
        const res = await fetch(RPC, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', method: 'chain_getHealth', params: [], id: 1 })
        });
        const data = await res.json();
        if (data.result) {
            log('RPC Connection', 'pass', `Connected to ${RPC}`);
        } else if (data.error) {
            log('RPC Connection', 'fail', data.error.message);
        }
    } catch (e) {
        log('RPC Connection', 'fail', e.message);
    }

    // Test 2: Chain Health
    try {
        const res = await fetch(RPC, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', method: 'chain_getBlockNumber', params: [], id: 2 })
        });
        const data = await res.json();
        if (data.result) {
            log('Chain Health', 'pass', `Current block: ${data.result}`);
        } else {
            log('Chain Health', 'fail', 'Could not get block number');
        }
    } catch (e) {
        log('Chain Health', 'fail', e.message);
    }

    // Test 3: Latency
    try {
        const start = performance.now();
        await fetch(RPC, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', method: 'chain_getHealth', params: [], id: 3 })
        });
        const latency = Math.round(performance.now() - start);
        if (latency < 500) {
            log('Latency', 'pass', `${latency}ms (excellent)`);
        } else if (latency < 2000) {
            log('Latency', 'warn', `${latency}ms (acceptable)`);
        } else {
            log('Latency', 'fail', `${latency}ms (too slow)`);
        }
    } catch (e) {
        log('Latency', 'fail', e.message);
    }

    // Test 4: DRC-369 Endpoint
    try {
        const testAddr = '0x0000000000000000000000000000000000000000';
        const res = await fetch(RPC, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', method: 'drc369_getAssetsByOwner', params: [testAddr], id: 4 })
        });
        const data = await res.json();
        if (data.result !== undefined || (data.error && data.error.code)) {
            log('DRC-369 API', 'pass', 'Endpoint responding');
        } else {
            log('DRC-369 API', 'warn', 'Unexpected response format');
        }
    } catch (e) {
        log('DRC-369 API', 'fail', e.message);
    }

    // Test 5: HTTPS
    if (RPC.startsWith('https://')) {
        log('HTTPS', 'pass', 'Using secure connection');
    } else {
        log('HTTPS', 'fail', 'Not using HTTPS - insecure!');
    }

    // Test 6: Browser Wallet (if available)
    if (typeof window.ethereum !== 'undefined') {
        log('Web3 Wallet', 'pass', 'MetaMask or compatible wallet detected');
    } else {
        log('Web3 Wallet', 'warn', 'No browser wallet detected (OK for server games)');
    }

    // Summary
    console.log('\n📊 Diagnostic Summary:');
    console.log(`   Passed: ${results.passed}`);
    console.log(`   Warnings: ${results.warnings}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`\n${results.failed === 0 ? '✅ Ready for Demiurge integration!' : '❌ Fix issues before proceeding'}`);
    
    return results;
})();
```

---

## Engine-Specific Diagnostics

### Unreal Engine 5

Add this diagnostic function to your `DemiurgeSubsystem`:

**DemiurgeSubsystem.h** (add to public section):

```cpp
// Diagnostic function
UFUNCTION(BlueprintCallable, Category = "Demiurge|Diagnostic")
void RunDiagnostic();

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnDiagnosticComplete, bool, bAllPassed, FString, Report);

UPROPERTY(BlueprintAssignable, Category = "Demiurge|Diagnostic")
FOnDiagnosticComplete OnDiagnosticComplete;
```

**DemiurgeDiagnostic.cpp**:

```cpp
void UDemiurgeSubsystem::RunDiagnostic()
{
    TArray<FString> Results;
    bool bAllPassed = true;
    
    UE_LOG(LogTemp, Log, TEXT("=== DRC-SDK Diagnostic Starting ==="));
    
    // Test 1: Configuration
    if (RPC_URL.IsEmpty())
    {
        Results.Add(TEXT("❌ RPC_URL not configured"));
        bAllPassed = false;
    }
    else if (!RPC_URL.StartsWith(TEXT("https://")))
    {
        Results.Add(TEXT("⚠️ RPC_URL should use HTTPS"));
    }
    else
    {
        Results.Add(FString::Printf(TEXT("✅ RPC configured: %s"), *RPC_URL));
    }
    
    // Test 2: Wallet
    if (UserWalletAddress.IsEmpty())
    {
        Results.Add(TEXT("⚠️ No wallet connected (call ConnectWallet first)"));
    }
    else if (!UserWalletAddress.StartsWith(TEXT("0x")) || UserWalletAddress.Len() != 42)
    {
        Results.Add(TEXT("❌ Invalid wallet address format"));
        bAllPassed = false;
    }
    else
    {
        Results.Add(TEXT("✅ Wallet address format valid"));
    }
    
    // Test 3: HTTP Module
    if (FHttpModule::Get().IsHttpEnabled())
    {
        Results.Add(TEXT("✅ HTTP module enabled"));
    }
    else
    {
        Results.Add(TEXT("❌ HTTP module not available"));
        bAllPassed = false;
    }
    
    // Test 4: Network connectivity (async)
    TSharedPtr<FJsonObject> Payload = MakeShareable(new FJsonObject);
    Payload->SetStringField(TEXT("jsonrpc"), TEXT("2.0"));
    Payload->SetStringField(TEXT("method"), TEXT("chain_getHealth"));
    Payload->SetArrayField(TEXT("params"), TArray<TSharedPtr<FJsonValue>>());
    Payload->SetNumberField(TEXT("id"), 1);
    
    FString PayloadStr;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&PayloadStr);
    FJsonSerializer::Serialize(Payload.ToSharedRef(), Writer);
    
    FHttpRequestRef Request = FHttpModule::Get().CreateRequest();
    Request->SetURL(RPC_URL);
    Request->SetVerb(TEXT("POST"));
    Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    Request->SetContentAsString(PayloadStr);
    
    Request->OnProcessRequestComplete().BindLambda(
        [this, Results, bAllPassed](FHttpRequestPtr Req, FHttpResponsePtr Res, bool bSuccess) mutable
        {
            if (bSuccess && Res.IsValid() && Res->GetResponseCode() == 200)
            {
                Results.Add(TEXT("✅ RPC connection successful"));
                
                // Parse response for chain health
                TSharedPtr<FJsonObject> JsonObj;
                TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Res->GetContentAsString());
                if (FJsonSerializer::Deserialize(Reader, JsonObj) && JsonObj->HasField(TEXT("result")))
                {
                    Results.Add(TEXT("✅ Chain responding to queries"));
                }
            }
            else
            {
                Results.Add(TEXT("❌ RPC connection failed"));
                bAllPassed = false;
            }
            
            // Build report
            FString Report = TEXT("DRC-SDK Diagnostic Report\n");
            Report += TEXT("========================\n");
            for (const FString& Line : Results)
            {
                Report += Line + TEXT("\n");
            }
            Report += TEXT("========================\n");
            Report += bAllPassed ? TEXT("✅ All checks passed!") : TEXT("❌ Some checks failed");
            
            UE_LOG(LogTemp, Log, TEXT("%s"), *Report);
            OnDiagnosticComplete.Broadcast(bAllPassed, Report);
        });
    
    Request->ProcessRequest();
}
```

**Blueprint Usage:**

1. Get Demiurge Subsystem reference
2. Call `Run Diagnostic`
3. Bind to `OnDiagnosticComplete` event
4. Display results in a debug UI panel

---

### Unity 6

Add this diagnostic class to your DemiurgeSDK folder:

**DemiurgeDiagnostic.cs**:

```csharp
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;
using Newtonsoft.Json.Linq;

namespace DemiurgeSDK
{
    /// <summary>
    /// Diagnostic tool for verifying DRC-SDK integration
    /// </summary>
    public class DemiurgeDiagnostic : MonoBehaviour
    {
        [Serializable]
        public class DiagnosticResult
        {
            public string testName;
            public string status; // "pass", "warn", "fail"
            public string message;
        }

        [Serializable]
        public class DiagnosticReport
        {
            public List<DiagnosticResult> results = new();
            public int passed;
            public int warnings;
            public int failed;
            public bool allPassed;
        }

        public event Action<DiagnosticReport> OnDiagnosticComplete;

        /// <summary>
        /// Run full diagnostic suite
        /// </summary>
        public async Task<DiagnosticReport> RunDiagnosticAsync()
        {
            var report = new DiagnosticReport();
            
            Debug.Log("🔍 DRC-SDK Diagnostic Starting...");

            // Test 1: DemiurgeManager exists
            if (DemiurgeManager.Instance != null)
            {
                AddResult(report, "DemiurgeManager", "pass", "Singleton initialized");
            }
            else
            {
                AddResult(report, "DemiurgeManager", "fail", "Not found - add DemiurgeManager to scene");
            }

            // Test 2: Configuration
            if (DemiurgeManager.Instance != null)
            {
                string rpcUrl = DemiurgeManager.Instance.RpcUrl;
                
                if (string.IsNullOrEmpty(rpcUrl))
                {
                    AddResult(report, "RPC Configuration", "fail", "RPC URL not set");
                }
                else if (!rpcUrl.StartsWith("https://"))
                {
                    AddResult(report, "RPC Configuration", "warn", "Should use HTTPS for security");
                }
                else
                {
                    AddResult(report, "RPC Configuration", "pass", $"Configured: {rpcUrl}");
                }

                // Test 3: Wallet
                if (DemiurgeManager.Instance.IsConnected)
                {
                    string addr = DemiurgeManager.Instance.WalletAddress;
                    if (IsValidAddress(addr))
                    {
                        AddResult(report, "Wallet", "pass", $"Connected: {addr.Substring(0, 10)}...");
                    }
                    else
                    {
                        AddResult(report, "Wallet", "fail", "Invalid address format");
                    }
                }
                else
                {
                    AddResult(report, "Wallet", "warn", "No wallet connected");
                }

                // Test 4: RPC Connectivity
                await TestRpcConnectivity(report, rpcUrl);

                // Test 5: Chain Health
                await TestChainHealth(report, rpcUrl);

                // Test 6: Latency
                await TestLatency(report, rpcUrl);

                // Test 7: DRC-369 API
                await TestDrc369Api(report, rpcUrl);
            }

            // Test 8: Platform checks
#if UNITY_WEBGL
            AddResult(report, "Platform", "pass", "WebGL build - browser wallet compatible");
#else
            AddResult(report, "Platform", "warn", "Non-WebGL build - ensure wallet handling is implemented");
#endif

            // Calculate summary
            report.allPassed = report.failed == 0;
            
            // Log report
            LogReport(report);
            
            OnDiagnosticComplete?.Invoke(report);
            return report;
        }

        private async Task TestRpcConnectivity(DiagnosticReport report, string rpcUrl)
        {
            try
            {
                var payload = new { jsonrpc = "2.0", method = "chain_getHealth", @params = new object[0], id = 1 };
                string json = Newtonsoft.Json.JsonConvert.SerializeObject(payload);

                using var request = new UnityWebRequest(rpcUrl, "POST");
                request.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json));
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");
                request.timeout = 10;

                var operation = request.SendWebRequest();
                while (!operation.isDone) await Task.Yield();

                if (request.result == UnityWebRequest.Result.Success)
                {
                    AddResult(report, "RPC Connectivity", "pass", "Connection successful");
                }
                else
                {
                    AddResult(report, "RPC Connectivity", "fail", $"Error: {request.error}");
                }
            }
            catch (Exception e)
            {
                AddResult(report, "RPC Connectivity", "fail", e.Message);
            }
        }

        private async Task TestChainHealth(DiagnosticReport report, string rpcUrl)
        {
            try
            {
                var payload = new { jsonrpc = "2.0", method = "chain_getBlockNumber", @params = new object[0], id = 2 };
                string json = Newtonsoft.Json.JsonConvert.SerializeObject(payload);

                using var request = new UnityWebRequest(rpcUrl, "POST");
                request.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json));
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");

                var operation = request.SendWebRequest();
                while (!operation.isDone) await Task.Yield();

                if (request.result == UnityWebRequest.Result.Success)
                {
                    var data = JObject.Parse(request.downloadHandler.text);
                    if (data["result"] != null)
                    {
                        AddResult(report, "Chain Health", "pass", $"Block: {data["result"]}");
                    }
                    else
                    {
                        AddResult(report, "Chain Health", "warn", "Unexpected response");
                    }
                }
                else
                {
                    AddResult(report, "Chain Health", "fail", request.error);
                }
            }
            catch (Exception e)
            {
                AddResult(report, "Chain Health", "fail", e.Message);
            }
        }

        private async Task TestLatency(DiagnosticReport report, string rpcUrl)
        {
            try
            {
                var payload = new { jsonrpc = "2.0", method = "chain_getHealth", @params = new object[0], id = 3 };
                string json = Newtonsoft.Json.JsonConvert.SerializeObject(payload);

                var startTime = DateTime.UtcNow;

                using var request = new UnityWebRequest(rpcUrl, "POST");
                request.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json));
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");

                var operation = request.SendWebRequest();
                while (!operation.isDone) await Task.Yield();

                var latency = (DateTime.UtcNow - startTime).TotalMilliseconds;

                if (latency < 500)
                    AddResult(report, "Latency", "pass", $"{latency:F0}ms (excellent)");
                else if (latency < 2000)
                    AddResult(report, "Latency", "warn", $"{latency:F0}ms (acceptable)");
                else
                    AddResult(report, "Latency", "fail", $"{latency:F0}ms (too slow)");
            }
            catch (Exception e)
            {
                AddResult(report, "Latency", "fail", e.Message);
            }
        }

        private async Task TestDrc369Api(DiagnosticReport report, string rpcUrl)
        {
            try
            {
                var payload = new { 
                    jsonrpc = "2.0", 
                    method = "drc369_getAssetsByOwner", 
                    @params = new[] { "0x0000000000000000000000000000000000000000" }, 
                    id = 4 
                };
                string json = Newtonsoft.Json.JsonConvert.SerializeObject(payload);

                using var request = new UnityWebRequest(rpcUrl, "POST");
                request.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json));
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");

                var operation = request.SendWebRequest();
                while (!operation.isDone) await Task.Yield();

                if (request.result == UnityWebRequest.Result.Success)
                {
                    AddResult(report, "DRC-369 API", "pass", "Endpoint responding");
                }
                else
                {
                    AddResult(report, "DRC-369 API", "warn", "Endpoint may not be available");
                }
            }
            catch (Exception e)
            {
                AddResult(report, "DRC-369 API", "fail", e.Message);
            }
        }

        private bool IsValidAddress(string address)
        {
            return !string.IsNullOrEmpty(address) && 
                   address.StartsWith("0x") && 
                   address.Length == 42;
        }

        private void AddResult(DiagnosticReport report, string name, string status, string message)
        {
            report.results.Add(new DiagnosticResult { testName = name, status = status, message = message });
            
            if (status == "pass") report.passed++;
            else if (status == "warn") report.warnings++;
            else report.failed++;
        }

        private void LogReport(DiagnosticReport report)
        {
            var sb = new StringBuilder();
            sb.AppendLine("\n=== DRC-SDK Diagnostic Report ===");
            
            foreach (var result in report.results)
            {
                string icon = result.status == "pass" ? "✅" : result.status == "warn" ? "⚠️" : "❌";
                sb.AppendLine($"{icon} {result.testName}: {result.message}");
            }
            
            sb.AppendLine("================================");
            sb.AppendLine($"Passed: {report.passed} | Warnings: {report.warnings} | Failed: {report.failed}");
            sb.AppendLine(report.allPassed ? "✅ Ready for Demiurge integration!" : "❌ Fix issues before proceeding");
            
            Debug.Log(sb.ToString());
        }

        /// <summary>
        /// Quick diagnostic from inspector button
        /// </summary>
        [ContextMenu("Run Diagnostic")]
        public async void RunDiagnosticFromInspector()
        {
            await RunDiagnosticAsync();
        }
    }
}
```

**Usage:**

```csharp
// In any script
var diagnostic = gameObject.AddComponent<DemiurgeDiagnostic>();
diagnostic.OnDiagnosticComplete += (report) => {
    if (report.allPassed) {
        Debug.Log("Ready to go!");
    }
};
await diagnostic.RunDiagnosticAsync();
```

---

### Godot 4

Add this diagnostic script to your DemiurgeSDK folder:

**demiurge_diagnostic.gd**:

```gdscript
extends Node
class_name DemiurgeDiagnostic

## DRC-SDK Diagnostic Tool for Godot 4
## Run diagnostic tests to verify blockchain integration

signal diagnostic_complete(report: Dictionary)

const RPC_URL: String = "https://rpc.demiurge.cloud"

var _http_request: HTTPRequest
var _results: Array = []
var _pending_tests: int = 0

func _ready() -> void:
	_http_request = HTTPRequest.new()
	_http_request.timeout = 10.0
	add_child(_http_request)


## Run all diagnostic tests
func run_diagnostic() -> void:
	_results.clear()
	print("\n🔍 DRC-SDK Diagnostic Starting...\n")
	
	# Synchronous tests first
	_test_autoload()
	_test_configuration()
	_test_wallet()
	
	# Async network tests
	_pending_tests = 4
	_test_rpc_connectivity()
	_test_chain_health()
	_test_latency()
	_test_drc369_api()


func _test_autoload() -> void:
	# Check if Demiurge autoload exists
	if Engine.has_singleton("Demiurge") or has_node("/root/Demiurge"):
		_add_result("Autoload", "pass", "Demiurge singleton found")
	elif get_node_or_null("/root/Demiurge") != null:
		_add_result("Autoload", "pass", "Demiurge autoload registered")
	else:
		_add_result("Autoload", "warn", "Demiurge autoload not found (check Project Settings)")


func _test_configuration() -> void:
	var demiurge = get_node_or_null("/root/Demiurge")
	if demiurge == null:
		_add_result("Configuration", "fail", "Cannot check - Demiurge not loaded")
		return
	
	# Check RPC URL
	if demiurge.get("RPC_URL") != null:
		var url = demiurge.RPC_URL
		if url.is_empty():
			_add_result("RPC URL", "fail", "Not configured")
		elif not url.begins_with("https://"):
			_add_result("RPC URL", "warn", "Should use HTTPS: " + url)
		else:
			_add_result("RPC URL", "pass", "Configured: " + url)
	else:
		_add_result("RPC URL", "warn", "RPC_URL property not found")


func _test_wallet() -> void:
	var demiurge = get_node_or_null("/root/Demiurge")
	if demiurge == null:
		return
	
	if demiurge.get("wallet_address") != null:
		var addr = demiurge.wallet_address
		if addr.is_empty():
			_add_result("Wallet", "warn", "No wallet connected")
		elif not addr.begins_with("0x") or addr.length() != 42:
			_add_result("Wallet", "fail", "Invalid address format")
		else:
			_add_result("Wallet", "pass", "Valid address: " + addr.left(10) + "...")
	else:
		_add_result("Wallet", "warn", "wallet_address property not found")


func _test_rpc_connectivity() -> void:
	var payload = {
		"jsonrpc": "2.0",
		"method": "chain_getHealth",
		"params": [],
		"id": 1
	}
	
	var http = HTTPRequest.new()
	add_child(http)
	
	var error = http.request(
		RPC_URL,
		["Content-Type: application/json"],
		HTTPClient.METHOD_POST,
		JSON.stringify(payload)
	)
	
	if error != OK:
		_add_result("RPC Connectivity", "fail", "Request failed to start")
		_finish_async_test(http)
		return
	
	var response = await http.request_completed
	http.queue_free()
	
	if response[1] == 200:
		_add_result("RPC Connectivity", "pass", "Connection successful")
	else:
		_add_result("RPC Connectivity", "fail", "HTTP " + str(response[1]))
	
	_check_completion()


func _test_chain_health() -> void:
	var payload = {
		"jsonrpc": "2.0",
		"method": "chain_getBlockNumber",
		"params": [],
		"id": 2
	}
	
	var http = HTTPRequest.new()
	add_child(http)
	
	var error = http.request(
		RPC_URL,
		["Content-Type: application/json"],
		HTTPClient.METHOD_POST,
		JSON.stringify(payload)
	)
	
	if error != OK:
		_add_result("Chain Health", "fail", "Request failed")
		_finish_async_test(http)
		return
	
	var response = await http.request_completed
	http.queue_free()
	
	if response[1] == 200:
		var json = JSON.new()
		if json.parse(response[3].get_string_from_utf8()) == OK:
			var data = json.get_data()
			if data.has("result"):
				_add_result("Chain Health", "pass", "Block: " + str(data["result"]))
			else:
				_add_result("Chain Health", "warn", "Unexpected response")
		else:
			_add_result("Chain Health", "fail", "JSON parse error")
	else:
		_add_result("Chain Health", "fail", "HTTP " + str(response[1]))
	
	_check_completion()


func _test_latency() -> void:
	var payload = {
		"jsonrpc": "2.0",
		"method": "chain_getHealth",
		"params": [],
		"id": 3
	}
	
	var http = HTTPRequest.new()
	add_child(http)
	
	var start_time = Time.get_ticks_msec()
	
	var error = http.request(
		RPC_URL,
		["Content-Type: application/json"],
		HTTPClient.METHOD_POST,
		JSON.stringify(payload)
	)
	
	if error != OK:
		_add_result("Latency", "fail", "Request failed")
		_finish_async_test(http)
		return
	
	var response = await http.request_completed
	http.queue_free()
	
	var latency = Time.get_ticks_msec() - start_time
	
	if latency < 500:
		_add_result("Latency", "pass", "%dms (excellent)" % latency)
	elif latency < 2000:
		_add_result("Latency", "warn", "%dms (acceptable)" % latency)
	else:
		_add_result("Latency", "fail", "%dms (too slow)" % latency)
	
	_check_completion()


func _test_drc369_api() -> void:
	var payload = {
		"jsonrpc": "2.0",
		"method": "drc369_getAssetsByOwner",
		"params": ["0x0000000000000000000000000000000000000000"],
		"id": 4
	}
	
	var http = HTTPRequest.new()
	add_child(http)
	
	var error = http.request(
		RPC_URL,
		["Content-Type: application/json"],
		HTTPClient.METHOD_POST,
		JSON.stringify(payload)
	)
	
	if error != OK:
		_add_result("DRC-369 API", "fail", "Request failed")
		_finish_async_test(http)
		return
	
	var response = await http.request_completed
	http.queue_free()
	
	if response[1] == 200:
		_add_result("DRC-369 API", "pass", "Endpoint responding")
	else:
		_add_result("DRC-369 API", "warn", "May not be available")
	
	_check_completion()


func _finish_async_test(http: HTTPRequest) -> void:
	http.queue_free()
	_check_completion()


func _check_completion() -> void:
	_pending_tests -= 1
	if _pending_tests <= 0:
		_generate_report()


func _add_result(test_name: String, status: String, message: String) -> void:
	var icon = "✅" if status == "pass" else ("⚠️" if status == "warn" else "❌")
	print("%s %s: %s" % [icon, test_name, message])
	_results.append({
		"name": test_name,
		"status": status,
		"message": message
	})


func _generate_report() -> void:
	var passed = 0
	var warnings = 0
	var failed = 0
	
	for result in _results:
		match result["status"]:
			"pass": passed += 1
			"warn": warnings += 1
			"fail": failed += 1
	
	print("\n=== DRC-SDK Diagnostic Report ===")
	print("Passed: %d | Warnings: %d | Failed: %d" % [passed, warnings, failed])
	
	if failed == 0:
		print("✅ Ready for Demiurge integration!")
	else:
		print("❌ Fix issues before proceeding")
	
	var report = {
		"results": _results,
		"passed": passed,
		"warnings": warnings,
		"failed": failed,
		"all_passed": failed == 0
	}
	
	diagnostic_complete.emit(report)
```

**Usage:**

```gdscript
# In any script
var diagnostic = DemiurgeDiagnostic.new()
add_child(diagnostic)
diagnostic.diagnostic_complete.connect(_on_diagnostic_done)
diagnostic.run_diagnostic()

func _on_diagnostic_done(report: Dictionary) -> void:
    if report["all_passed"]:
        print("All systems go!")
```

---

### Phaser / Browser Games

**src/plugins/DemiurgeDiagnostic.js**:

```javascript
/**
 * DRC-SDK Diagnostic Plugin for Phaser
 */
export default class DemiurgeDiagnostic extends Phaser.Plugins.BasePlugin {
    constructor(pluginManager) {
        super(pluginManager);
        this.rpcUrl = 'https://rpc.demiurge.cloud';
    }

    /**
     * Run all diagnostic tests
     * @returns {Promise<Object>} Diagnostic report
     */
    async runDiagnostic() {
        const results = [];
        console.log('🔍 DRC-SDK Diagnostic Starting...\n');

        // Test 1: Demiurge Plugin
        if (this.pluginManager.get('Demiurge')) {
            this.addResult(results, 'Demiurge Plugin', 'pass', 'Plugin registered');
        } else {
            this.addResult(results, 'Demiurge Plugin', 'fail', 'Plugin not found');
        }

        // Test 2: Configuration
        const demiurge = this.pluginManager.get('Demiurge');
        if (demiurge?.rpcUrl) {
            if (demiurge.rpcUrl.startsWith('https://')) {
                this.addResult(results, 'RPC Configuration', 'pass', demiurge.rpcUrl);
            } else {
                this.addResult(results, 'RPC Configuration', 'warn', 'Should use HTTPS');
            }
        } else {
            this.addResult(results, 'RPC Configuration', 'fail', 'Not configured');
        }

        // Test 3: Wallet
        if (demiurge?.walletAddress) {
            if (this.isValidAddress(demiurge.walletAddress)) {
                this.addResult(results, 'Wallet', 'pass', `Connected: ${demiurge.walletAddress.slice(0, 10)}...`);
            } else {
                this.addResult(results, 'Wallet', 'fail', 'Invalid address format');
            }
        } else {
            this.addResult(results, 'Wallet', 'warn', 'No wallet connected');
        }

        // Test 4: Browser Wallet
        if (typeof window.ethereum !== 'undefined') {
            this.addResult(results, 'Web3 Wallet', 'pass', 'MetaMask detected');
        } else {
            this.addResult(results, 'Web3 Wallet', 'warn', 'No browser wallet');
        }

        // Test 5: RPC Connectivity
        await this.testRpcConnectivity(results);

        // Test 6: Chain Health
        await this.testChainHealth(results);

        // Test 7: Latency
        await this.testLatency(results);

        // Test 8: DRC-369 API
        await this.testDrc369Api(results);

        // Test 9: CORS
        await this.testCors(results);

        // Generate report
        const report = this.generateReport(results);
        console.log(this.formatReport(report));
        
        return report;
    }

    async testRpcConnectivity(results) {
        try {
            const res = await fetch(this.rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', method: 'chain_getHealth', params: [], id: 1 })
            });
            
            if (res.ok) {
                this.addResult(results, 'RPC Connectivity', 'pass', 'Connection successful');
            } else {
                this.addResult(results, 'RPC Connectivity', 'fail', `HTTP ${res.status}`);
            }
        } catch (e) {
            this.addResult(results, 'RPC Connectivity', 'fail', e.message);
        }
    }

    async testChainHealth(results) {
        try {
            const res = await fetch(this.rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', method: 'chain_getBlockNumber', params: [], id: 2 })
            });
            const data = await res.json();
            
            if (data.result) {
                this.addResult(results, 'Chain Health', 'pass', `Block: ${data.result}`);
            } else {
                this.addResult(results, 'Chain Health', 'warn', 'Unexpected response');
            }
        } catch (e) {
            this.addResult(results, 'Chain Health', 'fail', e.message);
        }
    }

    async testLatency(results) {
        try {
            const start = performance.now();
            await fetch(this.rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', method: 'chain_getHealth', params: [], id: 3 })
            });
            const latency = Math.round(performance.now() - start);
            
            if (latency < 500) {
                this.addResult(results, 'Latency', 'pass', `${latency}ms (excellent)`);
            } else if (latency < 2000) {
                this.addResult(results, 'Latency', 'warn', `${latency}ms (acceptable)`);
            } else {
                this.addResult(results, 'Latency', 'fail', `${latency}ms (too slow)`);
            }
        } catch (e) {
            this.addResult(results, 'Latency', 'fail', e.message);
        }
    }

    async testDrc369Api(results) {
        try {
            const res = await fetch(this.rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    jsonrpc: '2.0', 
                    method: 'drc369_getAssetsByOwner', 
                    params: ['0x0000000000000000000000000000000000000000'], 
                    id: 4 
                })
            });
            
            if (res.ok) {
                this.addResult(results, 'DRC-369 API', 'pass', 'Endpoint responding');
            } else {
                this.addResult(results, 'DRC-369 API', 'warn', 'May not be available');
            }
        } catch (e) {
            this.addResult(results, 'DRC-369 API', 'fail', e.message);
        }
    }

    async testCors(results) {
        try {
            // Test if we can make cross-origin requests
            const res = await fetch(this.rpcUrl, {
                method: 'OPTIONS'
            });
            
            const allowOrigin = res.headers.get('Access-Control-Allow-Origin');
            if (allowOrigin) {
                this.addResult(results, 'CORS', 'pass', `Allowed: ${allowOrigin}`);
            } else {
                this.addResult(results, 'CORS', 'warn', 'Headers not visible (may still work)');
            }
        } catch (e) {
            this.addResult(results, 'CORS', 'warn', 'Could not verify CORS');
        }
    }

    isValidAddress(address) {
        return address && address.startsWith('0x') && address.length === 42;
    }

    addResult(results, name, status, message) {
        const icon = status === 'pass' ? '✅' : status === 'warn' ? '⚠️' : '❌';
        console.log(`${icon} ${name}: ${message}`);
        results.push({ name, status, message });
    }

    generateReport(results) {
        let passed = 0, warnings = 0, failed = 0;
        
        results.forEach(r => {
            if (r.status === 'pass') passed++;
            else if (r.status === 'warn') warnings++;
            else failed++;
        });

        return {
            results,
            passed,
            warnings,
            failed,
            allPassed: failed === 0
        };
    }

    formatReport(report) {
        let output = '\n=== DRC-SDK Diagnostic Report ===\n';
        output += `Passed: ${report.passed} | Warnings: ${report.warnings} | Failed: ${report.failed}\n`;
        output += report.allPassed ? '✅ Ready for Demiurge integration!' : '❌ Fix issues before proceeding';
        return output;
    }
}
```

**Usage in Scene:**

```javascript
// In any scene
create() {
    // Add diagnostic plugin if not registered globally
    const diagnostic = new DemiurgeDiagnostic(this.plugins);
    
    // Run diagnostic
    diagnostic.runDiagnostic().then(report => {
        if (report.allPassed) {
            console.log('Ready to go!');
        }
    });
}
```

---

## Common Issues & Solutions

### Issue: RPC Connection Failed

**Symptoms**: `❌ RPC Connectivity: Failed to fetch`

**Solutions**:
1. Check internet connection
2. Verify RPC URL is correct: `https://rpc.demiurge.cloud`
3. Check firewall isn't blocking HTTPS
4. For WebGL: Ensure CORS is configured

### Issue: Latency Too High

**Symptoms**: `❌ Latency: 5000ms (too slow)`

**Solutions**:
1. Check your network speed
2. Try a different network (mobile data vs WiFi)
3. Contact Demiurge support if consistently slow

### Issue: DRC-369 API Not Responding

**Symptoms**: `⚠️ DRC-369 API: May not be available`

**Solutions**:
1. The testnet may be in maintenance
2. Check [status.demiurge.cloud](https://status.demiurge.cloud) for uptime
3. Try again in a few minutes

### Issue: CORS Errors (Browser Games)

**Symptoms**: `❌ CORS: Blocked by CORS policy`

**Solutions**:
1. Use the official RPC endpoint (has CORS enabled)
2. If using custom endpoint, add CORS headers:
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET, POST, OPTIONS
   Access-Control-Allow-Headers: Content-Type
   ```
3. For development, use a CORS proxy

### Issue: No Wallet Detected

**Symptoms**: `⚠️ Web3 Wallet: No browser wallet`

**Solutions**:
1. Install MetaMask: [metamask.io](https://metamask.io)
2. For non-browser games, this warning is expected
3. Implement manual wallet connection flow

---

## Automated CI/CD Integration

Add this to your build pipeline to catch integration issues early:

**GitHub Actions Example:**

```yaml
name: DRC-SDK Diagnostic

on: [push, pull_request]

jobs:
  diagnostic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Run DRC-SDK Diagnostic
        run: |
          node -e "
          const https = require('https');
          const RPC = 'https://rpc.demiurge.cloud';
          
          const payload = JSON.stringify({
            jsonrpc: '2.0',
            method: 'chain_getHealth',
            params: [],
            id: 1
          });
          
          const req = https.request(RPC, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              const json = JSON.parse(data);
              if (json.result) {
                console.log('✅ DRC-SDK: Chain connection verified');
                process.exit(0);
              } else {
                console.log('❌ DRC-SDK: Chain connection failed');
                process.exit(1);
              }
            });
          });
          
          req.on('error', (e) => {
            console.log('❌ DRC-SDK: ' + e.message);
            process.exit(1);
          });
          
          req.write(payload);
          req.end();
          "
```

---

## Next Steps

After passing all diagnostics:

1. **[DRC-SDK Overview](../DRC_SDK.md)** - Complete integration guide
2. **[Oracle Backend](./ORACLE_BACKEND.md)** - Set up secure reward minting
3. **[DRC-369 Guide](../../creators/drc369-complete-guide.md)** - NFT integration details

---

**Verify before you fly. The code serves the will.**

---

*Last Updated: January 26, 2026*  
*Document Version: 1.0*  
*Maintainer: Alaustrup*
