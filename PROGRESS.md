# Progress Report

## Inital Planning Phase
In the initial phase of the project, Sam and I reviewed Efratror's prior work on the Language Server Protocol (LSP) for Processing. We explored the possibility of updating the Processing version from the previous implementation to Processing 4.1+ and 4.3 and decided to set up a [ROADMAP.m](https://github.com/diyaayay/processing-language-server-extension/blob/main/ROADMAP.md) to track tasks, get the sketches to work, and decide whether to build upon the prior work or start from scratch due to the version transitions.

## Week 1-3

During the first week, I successfully built Efratror's LSP for Processing 4.0.8b, which utilized Java 8 and the now-deprecated version of VSCode language server extension protocol.

Justin assisted me in identifying the essential dependencies required to run the Processing core and demonstrated his local setup for running Processing. We also discussed using the same Java runtime (17.0.8+7) that Processing was built with.

## Transition to Processing 4.3

The next challenge was transitioning to Processing 4.3. The initial plan was to replace core.jar and other dependencies in the working LSP with their current versions and then start building LSP features over Processing 4.3. However, this approach proved to be more complex than anticipated.

To address this, the next step involved generating a release for Processing 4.3 as a zip file containing `core.jar`. This zip file is used in `initserver.bat` to generate the JRE zip file with the required dependencies to run Processing sketches locally. This part is now complete, and the zip file can be found here: [dependency](https://github.com/diyaayay/processing4.3JRE/releases/download/v0.1/Processing-JRE-windows-x64-0.02-ALPHA.zip). This link is fetched by the .bat/.sh script in the LSP to set up the JRE zip files, which are then extracted and used in the LSP extension to run .pde sketches.

## Custom Jar Configuration

There is a `custom.jar` which has other important classes required to render processing sketches in VSCode like `OutputStream.class`, this `custom.jar` is still left to be set-up for processing 4.3 as it involves major changes from earlier versions. These classes are to be handpicked and added/replaced for the current version.

## Current Progress

Over the past few weeks, I have set up the prior work on LSP, and it is running locally for all Processing sketches. Inspired by this, I am currently discussing with my mentors where to find the latest versions of all classes contained in `custom.jar`.

The [NPM Java](https://www.npmjs.com/package/java) package we're currently using is optimized for OpenJDK 7, while the Processing release works best with JDK 17.

# Week-4

I have set up the latest Processing 4.3 version to run locally on the server side and execute sketches in the extension host. This involved fetching JavaFX externally and creating a `JavaFX.jar`, generating a new `JRE` for Processing 4.3, and integrating the latest Processing `core.jar`.

The goal now is to find a concrete way to set up this build so that it can be used for future work and to streamline the process of running Processing from VSCode or any Electron frontend.


## Next Steps

In the coming weeks, the goal is to setup a client/server JSON-RPC architecture using VSCode LSP extension API and LSP docs, and to implement LSP features.