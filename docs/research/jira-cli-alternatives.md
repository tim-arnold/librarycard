# Jira CLI Alternatives Research

**Date**: August 22, 2025  
**Purpose**: Research alternatives to the problematic ankitpokhrel/jira-cli tool  
**Issue**: Current CLI has panic errors during issue creation (interface conversion bug)

## Current Problem Summary

**ankitpokhrel/jira-cli v1.6.0** fails with panic error:
```
panic: interface conversion: interface {} is string, not map[string]interface {}
goroutine 1 [running]: github.com/ankitpokhrel/jira-cli/internal/cmd/issue/create.(*createCmd).setIssueTypes
```

- ✅ **Working**: Issue editing, viewing, listing, commenting
- ❌ **Broken**: Issue creation (core functionality)
- **Root Cause**: CLI bug in parsing Jira API issue types response

## Alternative Jira CLI Tools

### 1. go-jira/jira ⭐ **RECOMMENDED**
**Repository**: https://github.com/go-jira/jira  
**Language**: Go  
**License**: Apache-2.0  
**Stars**: 2.7k+

**Pros**:
- ✅ **Stable and mature** - 765 commits, active maintenance
- ✅ **Simple installation** - `brew install go-jira` 
- ✅ **Highly configurable** - Custom templates and commands
- ✅ **Context-aware** - Project-specific configuration
- ✅ **Multiple auth methods** - Supports various Jira setups
- ✅ **Pre-built binaries** available

**Cons**:
- ⚠️ **Conflicts with current** - `jira` binary name collision
- ⚠️ **Configuration required** - More setup than current tool
- ⚠️ **Learning curve** - Different command structure

**Installation**:
```bash
# Remove current jira-cli first to avoid conflicts
brew uninstall jira-cli
brew install go-jira
```

**Issue Creation Example**:
```bash
jira create --project=LCWEB --issuetype=Task --summary="New task" --description="Task description"
```

---

### 2. jiracli (Node.js) ⭐ **GOOD ALTERNATIVE**
**Documentation**: https://docs.jiracli.com/  
**Language**: Node.js/JavaScript  
**License**: MIT

**Pros**:
- ✅ **Simple setup** - `npm install -g jira-cl`
- ✅ **Straightforward commands** - `jira create`
- ✅ **Official API** - Uses Jira REST API directly
- ✅ **Lightweight** - Minimal dependencies
- ✅ **No conflicts** - Different binary name

**Cons**:
- ⚠️ **Node.js dependency** - Requires Node.js runtime
- ⚠️ **Limited features** - Basic functionality only
- ⚠️ **Different workflow** - Command structure differs from current

**Installation**:
```bash
npm install -g jira-cl
```

**Setup**:
```bash
jira config  # Interactive setup with host, email, API token
```

---

### 3. jira-cli (Python) ⚠️ **LIMITED**
**PyPI**: https://pypi.org/project/jira-cli/  
**Language**: Python  
**License**: Not specified  
**Last Update**: November 2020

**Pros**:
- ✅ **Python-based** - Good for Python environments
- ✅ **Production/Stable** status
- ✅ **Simple pip install** - `pip install jira-cli`

**Cons**:
- ❌ **Outdated** - Last updated 2020
- ❌ **Python 2.7** - Legacy Python support
- ❌ **Limited documentation** - Sparse usage examples
- ❌ **Unknown maintenance** - Unclear if actively maintained

---

### 4. Appfire Jira CLI ⚠️ **COMMERCIAL**
**Marketplace**: https://marketplace.atlassian.com/apps/6398/jira-command-line-interface-cli  
**Type**: Commercial Atlassian Marketplace app  
**License**: Paid

**Pros**:
- ✅ **Feature-rich** - 1000+ actions
- ✅ **Professional support** - Partner supported
- ✅ **Multi-platform** - Cloud, Server, Data Center
- ✅ **Bulk operations** - Advanced automation capabilities

**Cons**:
- ❌ **Commercial license** - Paid solution
- ❌ **Complex setup** - Requires marketplace installation
- ❌ **Overkill** - Too advanced for basic issue creation needs

---

### 5. Official Atlassian CLI (ACLI) ⚠️ **LIMITED SCOPE**
**Info**: https://www.atlassian.com/blog/jira/atlassian-command-line-interface  
**Type**: Official Atlassian tool  
**License**: Proprietary

**Pros**:
- ✅ **Official** - Made by Atlassian
- ✅ **Cloud integrated** - All Jira Cloud plans
- ✅ **Admin focused** - Bulk operations

**Cons**:
- ⚠️ **Admin-oriented** - Not designed for developer workflows  
- ⚠️ **Limited availability** - May require specific Jira plans
- ⚠️ **Complex** - Focused on administrative tasks

## Comparison Matrix

| Tool | Language | Installation | Issue Creation | Stability | Learning Curve | Cost |
|------|----------|--------------|----------------|-----------|----------------|------|
| **go-jira** | Go | `brew install go-jira` | ✅ Flexible | ✅ High | Medium | Free |
| **jiracli (Node)** | Node.js | `npm install -g jira-cl` | ✅ Simple | ✅ Good | Low | Free |
| **jira-cli (Python)** | Python | `pip install jira-cli` | ⚠️ Unknown | ⚠️ Outdated | Medium | Free |
| **Appfire CLI** | Java | Marketplace | ✅ Advanced | ✅ High | High | Paid |
| **Current (broken)** | Go | `brew install jira-cli` | ❌ Broken | ❌ Low | Low | Free |

## Recommendations

### **Primary Recommendation: go-jira/jira**
**Why**: Most stable, feature-rich, and actively maintained free alternative.

**Migration Steps**:
1. **Backup current config**: Save any important settings from current CLI
2. **Remove current CLI**: `brew uninstall jira-cli` 
3. **Install go-jira**: `brew install go-jira`
4. **Configure**: Set up authentication and default project
5. **Test**: Verify issue creation works with your Jira instance

**Commands mapping**:
```bash
# Current (broken)
jira issue create -tTask -s"Summary" -b"Description"

# go-jira equivalent  
jira create --project=LCWEB --issuetype=Task --summary="Summary" --description="Description"
```

### **Secondary Recommendation: jiracli (Node.js)**
**Why**: Simpler alternative if go-jira setup is too complex.

**Best for**:
- Users who prefer simpler tools
- Node.js-friendly environments
- Quick setup needs

### **Avoid**:
- **Python jira-cli** - Outdated and unmaintained
- **Appfire CLI** - Overkill for basic needs
- **Official ACLI** - Admin-focused, not developer workflow

## Next Steps

1. **Test go-jira** in a separate environment first
2. **Document configuration** for your Jira setup  
3. **Create migration guide** with command mappings
4. **Update development workflow** documentation
5. **Train team** on new CLI commands

## Implementation Timeline

- **Phase 1** (Immediate): Test go-jira with basic operations
- **Phase 2** (This week): Migrate if successful, document new commands
- **Phase 3** (Next week): Update workflow guides and team training

This research recommends **go-jira** as the primary replacement due to its stability, active maintenance, and comprehensive feature set.