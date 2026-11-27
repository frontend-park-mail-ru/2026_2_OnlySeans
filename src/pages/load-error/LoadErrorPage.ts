import { Component } from '../../core/component.js';
import { EmptyState } from '../../components/empty-state/EmptyState.js';
import type { PageProps } from '../../app/router.js';
/** Ошибка загрузки модуля страницы допускает повтор без полной перезагрузки приложения. */
export class LoadErrorPage extends Component<PageProps> {
  static template = () => '<div class="load-error-page"><div data-slot="error"></div></div>';
  onRender() {
    document.title = 'Не удалось открыть страницу | Frame';
    this.insert(
      'error',
      new EmptyState({
        variant: 'error',
        title: 'Не удалось открыть страницу',
        text: 'Проверьте соединение и повторите попытку.',
        button: 'Повторить',
        onRetry: () => this.props.navigate(location.pathname + location.search, { replace: true }),
      }),
    );
  }
}
