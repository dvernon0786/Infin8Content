-- Check if the user belongs to the workflow's organization
-- User ID from token: dc056aff-87d5-471b-bb96-41efbc33a7c6
-- Organization ID from workflow: 4b124ab6-0145-49a5-8821-0652e25f4544

SELECT 
  u.id as user_id,
  u.email,
  uo.organization_id,
  o.name as organization_name,
  uo.role
FROM users u
JOIN user_organizations uo ON u.id = uo.user_id
JOIN organizations o ON uo.organization_id = o.id
WHERE u.id = 'dc056aff-87d5-471b-bb96-41efbc33a7c6'
AND uo.organization_id = '4b124ab6-0145-49a5-8821-0652e25f4544';
