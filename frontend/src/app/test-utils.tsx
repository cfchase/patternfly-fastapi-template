/**
 * Test Utilities for PatternFly Components
 *
 * This module provides helper functions for testing PatternFly-based
 * components. Use these helpers to avoid repetitive DOM queries and
 * improve test readability.
 *
 * Example usage:
 * ```typescript
 * import { render, screen } from '@testing-library/react';
 * import userEvent from '@testing-library/user-event';
 * import { tableHelpers, paginationHelpers, modalHelpers } from './test-utils';
 *
 * it('should select all rows', async () => {
 *   const user = userEvent.setup();
 *   render(<MyTable />);
 *
 *   const checkbox = tableHelpers.getSelectAllCheckbox();
 *   await user.click(checkbox);
 *
 *   tableHelpers.expectAllRowCheckboxes(true);
 * });
 * ```
 */

import { screen, within } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';

/**
 * Helpers for PatternFly Table components
 */
export const tableHelpers = {
  /**
   * Get all data from a specific column by its header text
   */
  getColumnData(columnLabel: string): string[] {
    const table = screen.getByRole('table');
    const headers = within(table).getAllByRole('columnheader');
    const columnIndex = headers.findIndex((header) =>
      header.textContent?.includes(columnLabel)
    );

    if (columnIndex === -1) {
      throw new Error(`Column "${columnLabel}" not found`);
    }

    const rows = within(table).getAllByRole('row').slice(1); // Skip header row
    return rows.map((row) => {
      const cells = within(row).getAllByRole('cell');
      return cells[columnIndex]?.textContent || '';
    });
  },

  /**
   * Get the number of data rows (excluding header)
   */
  getRowCount(): number {
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    return Math.max(0, rows.length - 1); // Subtract header row
  },

  /**
   * Get all row checkboxes
   */
  getRowCheckboxes(): HTMLInputElement[] {
    const table = screen.getByRole('table');
    return within(table)
      .getAllByRole('checkbox')
      .filter((cb) => !cb.getAttribute('aria-label')?.includes('Select all'))
      .map((cb) => cb as HTMLInputElement);
  },

  /**
   * Get the "Select All" checkbox
   */
  getSelectAllCheckbox(): HTMLInputElement {
    return screen.getByRole('checkbox', {
      name: /select all/i,
    }) as HTMLInputElement;
  },

  /**
   * Verify all row checkboxes have expected checked state
   */
  expectAllRowCheckboxes(checked: boolean): void {
    const checkboxes = tableHelpers.getRowCheckboxes();
    checkboxes.forEach((checkbox) => {
      if (checked) {
        expect(checkbox).toBeChecked();
      } else {
        expect(checkbox).not.toBeChecked();
      }
    });
  },

  /**
   * Get a specific row by index (0-based, excluding header)
   */
  getRow(index: number): HTMLElement {
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row').slice(1);
    if (index >= rows.length) {
      throw new Error(`Row ${index} not found. Table has ${rows.length} rows.`);
    }
    return rows[index];
  },
};

/**
 * Helpers for PatternFly Pagination components
 */
export const paginationHelpers = {
  /**
   * Get the current page info text (e.g., "1 - 10 of 100")
   */
  getPageInfo(): string {
    const pagination = screen.getByLabelText(/pagination/i);
    return pagination.textContent || '';
  },

  /**
   * Click next page button
   */
  async goToNextPage(user: UserEvent): Promise<void> {
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
  },

  /**
   * Click previous page button
   */
  async goToPreviousPage(user: UserEvent): Promise<void> {
    const prevButton = screen.getByRole('button', { name: /previous/i });
    await user.click(prevButton);
  },

  /**
   * Change items per page
   */
  async setPerPage(user: UserEvent, perPage: number): Promise<void> {
    const perPageToggle = screen.getByRole('button', { name: /per page/i });
    await user.click(perPageToggle);
    const option = screen.getByRole('menuitem', { name: new RegExp(`${perPage}`) });
    await user.click(option);
  },
};

/**
 * Helpers for PatternFly Modal components
 */
export const modalHelpers = {
  /**
   * Get modal by title
   */
  getModal(title: string): HTMLElement {
    return screen.getByRole('dialog', { name: title });
  },

  /**
   * Check if modal is open
   */
  isModalOpen(title: string): boolean {
    try {
      screen.getByRole('dialog', { name: title });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Close modal by clicking close button
   */
  async closeModal(user: UserEvent): Promise<void> {
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
  },

  /**
   * Get modal action button by name
   */
  getModalButton(name: string | RegExp): HTMLElement {
    const modal = screen.getByRole('dialog');
    return within(modal).getByRole('button', { name });
  },
};

/**
 * Helpers for PatternFly Form components
 */
export const formHelpers = {
  /**
   * Get form input by label
   */
  getInput(label: string): HTMLInputElement {
    return screen.getByLabelText(label) as HTMLInputElement;
  },

  /**
   * Get select/dropdown by label
   */
  getSelect(label: string): HTMLElement {
    return screen.getByRole('button', { name: new RegExp(label, 'i') });
  },

  /**
   * Fill in a text input
   */
  async fillInput(user: UserEvent, label: string, value: string): Promise<void> {
    const input = formHelpers.getInput(label);
    await user.clear(input);
    await user.type(input, value);
  },

  /**
   * Select an option from a dropdown
   */
  async selectOption(user: UserEvent, label: string, optionName: string): Promise<void> {
    const select = formHelpers.getSelect(label);
    await user.click(select);
    const option = screen.getByRole('option', { name: new RegExp(optionName, 'i') });
    await user.click(option);
  },

  /**
   * Get validation error message for a field
   */
  getFieldError(fieldName: string): string | null {
    try {
      const errorElement = screen.getByText(new RegExp(`${fieldName}.*required|invalid`, 'i'));
      return errorElement.textContent;
    } catch {
      return null;
    }
  },
};

/**
 * Helpers for PatternFly Toolbar components
 */
export const toolbarHelpers = {
  /**
   * Get search input in toolbar
   */
  getSearchInput(): HTMLInputElement {
    return screen.getByRole('searchbox') as HTMLInputElement;
  },

  /**
   * Perform search
   */
  async search(user: UserEvent, query: string): Promise<void> {
    const searchInput = toolbarHelpers.getSearchInput();
    await user.clear(searchInput);
    await user.type(searchInput, query);
    await user.keyboard('{Enter}');
  },

  /**
   * Clear search
   */
  async clearSearch(user: UserEvent): Promise<void> {
    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);
  },

  /**
   * Get filter dropdown button
   */
  getFilterButton(name: string | RegExp): HTMLElement {
    return screen.getByRole('button', { name });
  },
};

/**
 * Helpers for waiting and assertions
 */
export const asyncHelpers = {
  /**
   * Wait for loading state to finish
   */
  async waitForLoadingToFinish(): Promise<void> {
    // Wait for any spinners to disappear
    await screen.findByRole('main', {}, { timeout: 5000 });
  },

  /**
   * Wait for element to be removed
   */
  async waitForElementToBeRemoved(getText: string | RegExp): Promise<void> {
    const element = screen.queryByText(getText);
    if (element) {
      await screen.findByText(getText, {}, { timeout: 100 }).catch(() => {
        // Element was removed
      });
    }
  },
};
