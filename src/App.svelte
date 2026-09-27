<script>
  import Sidebar from './app/layout/Sidebar.svelte';
  import PageHeading from './app/layout/PageHeading.svelte';
  import { pages } from './app/pages.js';
  import PortfolioActions from './features/portfolio/components/PortfolioActions.svelte';
  import Footer from './app/layout/Footer.svelte';
  import FeedbackBanner from './shared/components/FeedbackBanner.svelte';
  import PortfolioPage from './features/portfolio/PortfolioPage.svelte';
  import AccountDrawer from './features/portfolio/components/AccountDrawer.svelte';
  import DataSourcesPage from './features/data-sources/DataSourcesPage.svelte';
  import RulesPage from './features/rules/RulesPage.svelte';
  import NotCoPage from './features/notco/NotCoPage.svelte';
  import { createNavigation } from './app/createNavigation.svelte.js';
  import { createDataSources } from './features/data-sources/createDataSources.svelte.js';
  import { createPortfolio } from './features/portfolio/createPortfolio.svelte.js';
  import { createNotCoAgent } from './features/notco/createNotCoAgent.svelte.js';

  let feedback = $state({ notice: '', error: '' });
  const navigation = createNavigation(() => {
    portfolio.search = '';
    portfolio.filter = 'all';
  });
  const sources = createDataSources(feedback, () => {
    portfolio.selectedId = null;
  });
  const portfolio = createPortfolio(sources, () => navigation.page);
  const agent = createNotCoAgent(feedback);
</script>

<div class="app-shell">
  <Sidebar {navigation} {sources} {portfolio} {feedback} />
  <div class="main-shell">
    <main>
      <PageHeading page={pages[navigation.page]}>
        {#if navigation.page === 'overview' || navigation.page === 'accounts'}
          <PortfolioActions
            {portfolio}
            onUpload={() => navigation.navigate('data')}
          />
        {/if}
      </PageHeading>
      <FeedbackBanner {feedback} />
      {#if navigation.page === 'overview' || navigation.page === 'accounts'}
        <PortfolioPage {navigation} {sources} {portfolio} />
      {:else if navigation.page === 'data'}
        <DataSourcesPage {sources} {portfolio} />
      {:else if navigation.page === 'rules'}
        <RulesPage {navigation} {portfolio} />
      {:else if navigation.page === 'agent'}
        <NotCoPage {agent} />
      {/if}
      {#if navigation.page !== 'agent'}<Footer />{/if}
    </main>
  </div>
</div>
<AccountDrawer {portfolio} />
