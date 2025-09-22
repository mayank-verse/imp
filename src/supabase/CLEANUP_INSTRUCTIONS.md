# Supabase Edge Function Cleanup Instructions

## The Problem
The 403 deployment error is caused by conflicting files and directories in the `/supabase/functions/` directory.

## Files to Delete (REQUIRED for deployment to work)

### 1. Delete entire `/supabase/functions/server/` directory
```
/supabase/functions/server/
├── DELETE_ME.txt
├── auth-service.tsx
├── database-repository.tsx
├── index.tsx
├── kv_store.tsx
├── ml-service.tsx
├── models.tsx
├── mrv-service.tsx
├── project-service.tsx
├── repository.tsx
├── routes-updated.tsx
├── routes.tsx
└── services/
    ├── auth-service.tsx
    ├── ml-service.tsx
    ├── mrv-service.tsx
    └── project-service.tsx
```

### 2. Delete `/supabase/functions/_shared/` directory
```
/supabase/functions/_shared/
└── cors.ts
```

### 3. Delete extra files from `/supabase/functions/make-server/`
Keep ONLY:
- `index.ts`
- `deno.json`

Delete these files:
- `CLEANUP_NEEDED.txt`
- `auth-service.ts`
- `database-repository.ts`
- `kv_store.ts`
- `ml-service.ts`
- `models.ts`
- `mrv-service.ts`
- `project-service.ts`
- `routes.ts`

### 4. Delete cleanup files
- `/supabase/functions/REMOVE_EXTRA_FILES.txt`

## Final Structure Should Be:
```
/supabase/
├── config.toml
├── functions/
│   └── make-server/
│       ├── index.ts
│       └── deno.json
└── migrations/
    ├── 001_initial_schema.sql
    └── README.md
```

## After Cleanup
Once you've deleted all the conflicting files, the Edge Function should deploy successfully without the 403 error.

The cleaned up Edge Function includes:
- Authentication middleware
- Role-based access control
- `/projects/manager-with-credits` endpoint for project managers
- Standard CRUD operations for your carbon credit platform