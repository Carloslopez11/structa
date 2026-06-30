fetch('https://structa-git-main-viral-idea.vercel.app/register.html')
  .then(res => res.text())
  .then(t => console.log(t.includes('/api/auth/register') ? 'UPDATED' : 'OLD_SUPABASE'))
  .catch(console.error);
