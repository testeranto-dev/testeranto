This ticket tracks the final integration of the vscode extension and stakeholders html report.

For both, we want to folow a similar pattern of consolidating a lot information into a small place

in the vscode extension, tests are broken down first by runtime, then tests. Here the source code, reports, logs etc are revealed

in the stakeholder html, the project is represented as a file tree. We gather the tests.json underneath the entrypoint.

the stakholder report does NOT reveal source code or logs, only the test results and the features. The stakeholder report focues on features, not implmentation. This is a way for the stakeholder to explore the project.

the vscode extension does NOT reveal features, only source code and files. It's focused on implementation. This is a way for adeveloper toexplore the project,

In Both cases, the features are inteleaved into thetree trucuture.

Important Note: the stakeholder report must be static only! It is not allowed to access the server's api, because it must run int GH PAGES.
