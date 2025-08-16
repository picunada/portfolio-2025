export async function getGitHubProfileStats() {
  try {
    // Get authenticated user
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const userData = await userResponse.json();
    const username = userData.login;

    // Get current year contributions (what shows on GitHub profile) — start request now to overlap with repos pagination
    const currentYear = new Date().getFullYear();
    const contributionsQuery = `
        query {
          user(login: "${username}"){
            contributionsCollection {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    contributionCount
                    date
                  }
                }
              }
            }
          }
        }
      `;

    const contributionsPromise = fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: contributionsQuery })
    }).then(res => res.json());

    // Calculate maintained repositories count (ADMIN or MAINTAIN permissions, not archived, not fork)
    let maintainedRepositoriesCount = 0;
    const maintainedReposToCheck: Array<{ owner: string; name: string }> = [];
    let hasNextPage = true;
    let endCursor: string | null = null;

    while (hasNextPage) {
      const reposQuery = `
        query {
          user(login: "${username}") {
            repositories(
              first: 100,
              affiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER],
              orderBy: { field: UPDATED_AT, direction: DESC }${endCursor ? `, after: "${endCursor}"` : ''}
            ) {
              pageInfo { hasNextPage endCursor }
              nodes {
                isArchived
                isFork
                viewerPermission
                name
                owner { login }
                isInOrganization
              }
            }
          }
        }
      `;

      const reposResponse = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: reposQuery })
      });

      const reposData = await reposResponse.json();
      if (reposData.errors) {
        console.error('GraphQL errors:', reposData.errors);
        throw new Error('GraphQL query failed');
      }

      const repoConnection = reposData.data.user.repositories;
      const nodes = repoConnection.nodes as Array<{ isArchived: boolean; isFork: boolean; viewerPermission: string; name: string; owner: { login: string }; isInOrganization: boolean }>;
      for (const repo of nodes) {
        const hasMaintainRights = repo.viewerPermission === 'ADMIN' || repo.viewerPermission === 'MAINTAIN' || repo.viewerPermission === 'WRITE';
        const isMaintained = !repo.isArchived && !repo.isFork && hasMaintainRights;
        if (isMaintained) {
          maintainedRepositoriesCount += 1;
          if (repo.isInOrganization) {
            maintainedReposToCheck.push({ owner: repo.owner.login, name: repo.name });
          }
        }
      }

      hasNextPage = repoConnection.pageInfo.hasNextPage as boolean;
      endCursor = repoConnection.pageInfo.endCursor as string | null;
    }

    // Count Actions workflow runs triggered by the current user across maintained repos — do it in parallel batches
    let actionsRunsTriggeredCount = 0;
    const batchSize = 16;
    for (let i = 0; i < maintainedReposToCheck.length; i += batchSize) {
      const batch = maintainedReposToCheck.slice(i, i + batchSize);
      const results = await Promise.allSettled(batch.map(async (repo) => {
        const url = `https://api.github.com/repos/${repo.owner}/${repo.name}/actions/runs?actor=${encodeURIComponent(username)}&per_page=1`;
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });
        console.log(res)
        if (!res.ok) return 0;
        const json = await res.json();
        return typeof json.total_count === 'number' ? (json.total_count as number) : 0;
      }));
      for (const r of results) {
        if (r.status === 'fulfilled') actionsRunsTriggeredCount += r.value as number;
      }
    }

    // Wait for contributions request result
    const contributionsData = await contributionsPromise;
    if (contributionsData.errors) {
      console.error('GraphQL errors:', contributionsData.errors);
      throw new Error('GraphQL query failed');
    }
    const contributions = contributionsData.data.user.contributionsCollection;

    return {
      username,
      currentYearContributions: contributions.contributionCalendar.totalContributions,
      maintainedRepositoriesCount,
      actionsRunsTriggeredCount,
    };

  } catch (error) {
    console.error('Error fetching GitHub stats:', error);
    return null;
  }
}
