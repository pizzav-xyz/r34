# Open Design MCP Tools

## Project Management

| Tool | What it does |
|---|---|
| `create_project` | Create a new Open Design project |
| `get_project` | Get project metadata (name, entry file, timestamps, preview URL) |
| `list_projects` | List all projects on this daemon |
| `delete_project` | Permanently delete a project and its files |
| `get_active_context` | See which project/file is currently active |

## File Operations

| Tool | What it does |
|---|---|
| `list_files` | List all files in a project (metadata) |
| `get_file` | Read a file (HTML, CSS, JSON, SVG, Markdown) |
| `get_artifact` | Get an entry file + all files it references (images, scripts, styles) |
| `write_file` | Write or overwrite a project file |
| `create_artifact` | Create a new artifact entry file with manifest |
| `delete_file` | Delete a file from a project |
| `search_files` | Search across all text files in a project |

## Design Execution

| Tool | What it does |
|---|---|
| `start_run` | Commission a design run (generates/modifies files using an agent) |
| `get_run` | Poll run status (queued → running → succeeded/failed) |
| `cancel_run` | Cancel an in-flight run |
| `list_agents` | List available AI agents (claude, codex, gemini, etc.) |
| `list_skills` | List Open Design skills (design recipes) |
| `list_plugins` | List installed design workflow plugins |

## Typical Workflow

1. **Create a project** → `create_project(name="My Design")`
2. **Write files** or **start a run** with a prompt/agent/skill
3. **Poll the run** → `get_run(runId)` until succeeded
4. **Get artifacts** → `get_artifact(entry="index.html")`
5. **Preview** → Open the `previewUrl` in a browser
