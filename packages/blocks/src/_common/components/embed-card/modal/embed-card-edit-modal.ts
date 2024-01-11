import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { BookmarkBlockComponent } from '../../../../bookmark-block/bookmark-block.js';
import type { BookmarkBlockModel } from '../../../../bookmark-block/bookmark-model.js';
import type { EmbedGithubBlockComponent } from '../../../../embed-github-block/embed-github-block.js';
import type { EmbedGithubModel } from '../../../../embed-github-block/embed-github-model.js';
import type { EmbedYoutubeBlockComponent } from '../../../../embed-youtube-block/embed-youtube-block.js';
import type { EmbedYoutubeModel } from '../../../../embed-youtube-block/embed-youtube-model.js';
import { toast } from '../../toast.js';
import { embedCardModalStyles } from './styles.js';

@customElement('embed-card-edit-modal')
export class EmbedCardEditModal extends WithDisposable(ShadowlessElement) {
  static override styles = embedCardModalStyles;

  @property({ attribute: false })
  embedCardElement!:
    | BookmarkBlockComponent
    | EmbedGithubBlockComponent
    | EmbedYoutubeBlockComponent;

  @query('.title')
  titleInput!: HTMLInputElement;

  @query('.description')
  descInput!: HTMLInputElement;

  @state()
  private _titleInputValue = '';

  get model(): BookmarkBlockModel | EmbedGithubModel | EmbedYoutubeModel {
    return this.embedCardElement.model;
  }

  override connectedCallback() {
    super.connectedCallback();

    this.updateComplete
      .then(() => {
        this.titleInput.focus();
        this.titleInput.setSelectionRange(0, this.titleInput.value.length);
      })
      .catch(console.error);

    this.disposables.addFromEvent(this, 'keydown', this._onDocumentKeydown);

    this._titleInputValue = this.model.title ?? '';
  }

  private _handleInput(e: InputEvent) {
    const target = e.target as HTMLInputElement;
    this._titleInputValue = target.value;
  }

  private _onDocumentKeydown(e: KeyboardEvent) {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.isComposing) {
      this._onSave();
    }
    if (e.key === 'Escape') {
      this.remove();
    }
  }

  private _onSave() {
    const title = this.titleInput.value;
    if (title.length === 0) {
      toast('Link title can not be empty');
      return;
    }

    this.embedCardElement.page.updateBlock(this.model, {
      title,
      description: this.descInput.value,
    });
    this.remove();
  }

  override render() {
    return html`
      <div class="embed-card-modal blocksuite-overlay">
        <div class="embed-card-modal-mask" @click=${() => this.remove()}></div>
        <div class="embed-card-modal-wrapper">
          <div class="embed-card-modal-title">Edit Link</div>

          <div class="embed-card-modal-content">
            <input
              class="embed-card-modal-input title"
              type="text"
              placeholder="Title"
              value=${this._titleInputValue}
              @input=${this._handleInput}
              tabindex="0"
            />

            <textarea
              class="embed-card-modal-input description"
              placeholder="Description"
              .value=${this.model.description ?? ''}
              tabindex="0"
            ></textarea>
          </div>

          <div class="embed-card-modal-action">
            <div
              class="embed-card-modal-button cancel"
              tabindex="0"
              @click=${() => this.remove()}
            >
              Cancel
            </div>

            <div
              class=${classMap({
                'embed-card-modal-button': true,
                save: true,
                disabled: this._titleInputValue.length === 0,
              })}
              tabindex="0"
              @click=${() => this._onSave()}
            >
              Save
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

export function toggleEmbedCardEditModal(
  embedCardElement:
    | BookmarkBlockComponent
    | EmbedGithubBlockComponent
    | EmbedYoutubeBlockComponent
) {
  embedCardElement.host.selection.clear();
  const embedCardEditModal = new EmbedCardEditModal();
  embedCardEditModal.embedCardElement = embedCardElement;
  document.body.appendChild(embedCardEditModal);
}

declare global {
  interface HTMLElementTagNameMap {
    'embed-card-edit-modal': EmbedCardEditModal;
  }
}
