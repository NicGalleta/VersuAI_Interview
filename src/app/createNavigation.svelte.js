export function createNavigation(onNavigate) {
  let page = $state('overview');
  return {
    get page() {
      return page;
    },
    set page(value) {
      page = value;
    },
    navigate(id) {
      page = id;
      onNavigate();
    },
  };
}
