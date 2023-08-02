---
publishDate: 2023-07-22T00:00:00Z
title: Dragonfly Client Internals
excerpt: Discussing the internals of our client compute node in the Dragonfly framework.
image: ~/assets/images/alfred-leung-unsplash.jpg
category: Documentation
tags:
  - rust
  - dragonfly
  - resources
---

### How it works: Overview

The following is a brief overview of how the client works. A more extensive
writeup can be found towards the bottom of this page.

The client is comprised of a few discrete components, each running
independently. These are the scanning threadpool, the loader thread, and the
sender thread.

- The Scanning Threadpool - Downloads and scans the releases.
- The Loader Thread - This thread is responsible for requesting jobs from the API and submitting them to the threadpool.

- The Sender Thread - This thread is responsible for reporting the results to the API.

### Performance, efficiency, and optimization

The client aims to be highly configurable to suit a variety of host machines.
The environment variables of most value in this regard are as follows:

- `DRAGONFLY_THREADS` defaults to the number of available parallelism, or
  1 if it could not be determined. [This
  page](https://doc.rust-lang.org/stable/std/thread/fn.available_parallelism.html)
  explains in detail how this is calculated, but in short, it is often the
  number of compute cores a machine has. The client will spawn this many
  threads in a threadpool executor to perform concurrent scanning of files.

- `DRAGONFLY_LOAD_DURATION` defaults to `60` seconds. This is the frequency
  with which the loader thread will send an HTTP API request to the Dragonfly
  API requesting N amount of jobs (defined by `DRAGONFLY_BULK_SIZE`). The jobs
  returned from the API will be loaded into the internal queue.

- `DRAGONFLY_BULK_SIZE` defaults to `20`. This is the amount of jobs the loader
  thread will request from the API at once. Setting this too high may mean the
  scanner threads can't keep up (packages are being loaded into the queue
  faster than they're being scanned), but setting this too low may mean that
  more CPU time is wasted by idling. `DRAGONFLY_MAX_SCAN_SIZE` defaults to

- `128000000`. The maximum size of downloaded distributions, in bytes. Setting
  this too high may cause clients with low memory to run out of memory and
  crash, setting it too low may mean most packages are not scanned (due to
  being above the size limit).

Many of these options have disadvantages to setting these options to any
extreme (too high or too low), so it's important to tweak it to a good middle
ground that works best in your environment. However, we have tried our best to
provide sensible defaults that will work reasonably efficiently: 20 jobs are
requested from the API every 60 seconds, and each scanner thread will wait 10
seconds before polling the internal queue if there are none.

### How it works: Detailed Breakdown

This section attempts to describe in detail how the client works under the
hood, and how the various configuration parameters come into play.

The client can be broken down into a few discrete components: The scanner
threads, the loader thread, the sender thread. We will first explore in detail
the workings of each of these components in isolation and then how they all fit
together.

The scanner thread(s) are what do most of the heavy lifting. They use bindings
to the C YARA library, and most of this code can be found in `scanner.rs`. The
way this program models PyPI data structure is as so: There are "packages" (or
"releases") which is a name/version specifier combination. These "packages" are
comprised of several "distributions" in the form of gzipped tarballs or wheels
(which behave similarly to zip files, hence the use of the `zip` crate). Each
distribution is comprised of a flat sequence of files (the hierarchical nature
of the traditional file/folder system has been flatted for our use case). The
main entry point interface to the scanner logic is via the
`scan_all_distribution`. This loops over the download URLs of each distribution
of the given job, and attempts to download them. The maximum size of these
downloads, in bytes, is controlled by the `DRAGONFLY_MAX_SIZE` environment
variable (128MB by default) Then, for each distribution downloaded, we loop
over each file in that distribution, load it into memory, and apply the
compiled YARA rules stored in memory against the file contents (this is done by
the underlying C YARA library). Then, the results of each files is stored in
a "distribution scan result" struct that represents the scan results of
a single distribution. This process is repeated for all the distributions in
a package, and are aggregated into a "package scan result" struct. This model
highly reflects PyPI's model of "package -> distributions -> files". This
process allows us to start with the download URLs of each distribution of
a package, and end with the scan results of each file of each distribution of
the given package.

The loader thread's primary responsibility is to request a bunch of jobs from
the API and load them into the queue on a timer. It will perform a "bulk job
request" (`POST /jobs`) API request to retrieve N jobs from the API, where
N can be configured via the `DRAGONFLY_BULK_SIZE` environment variable. The
client will make these bulk requests at an interval defined by
the`DRAGONFLY_LOAD_DURATION` environment variable. The jobs returned by the API
endpoint will then be loaded into the internal queue. This process repeats for
the duration of the program.

The sender thread's primary responsibility is to send results (whether that be
a success or a failure) to the API. This sender thread has ownership of the
single consumer part of the mpsc channel (multiple producers, single
consumers). The multiple producers (transmitting end) are in each scanner
thread, which send their results to this sender thread when they're done
scanning a package. This thread then sequentially sends these results over the
API. Reauthentication can be handled here as well, greatly simplifying the need
for concurrency and thread synchronization across many threads.

The client starts up by first authenticating with Auth0 to obtain an access
token. It then stores this access token in a shared-state thread
synchronization primitive that allows multiple concurrent readers but only one
writer. This new access token is used to fetch the YARA rules from the
Dragonfly API. The source code of the YARA rules is compiled (very much like
compiling regex) and stored in the shared state. Then, the necessary threads
are spawned in (with the exception of the "sender thread" which is, in fact,
the main thread). Each scanner thread will pull jobs from the internal queue,
scan it, and push the results across the mpsc channel to the sender thread. It
will then attempt to do this process again by pulling a job from the queue. If
there are none on the queue, it will sleep the thread for some amount of time
configurable by the `DRAGONFLY_WAIT_DURATION` environment variable, then try
again.
