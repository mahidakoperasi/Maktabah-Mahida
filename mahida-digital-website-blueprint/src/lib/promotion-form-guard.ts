// Observe interaction only; field values are never stored or sent anywhere.
const fields =
  'input:not([type="hidden"]):not([type="search"]):not([type="submit"]):not([type="button"]):not([type="reset"]),textarea,select,[contenteditable="true"]';

export function editingPublicForm(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  const field = target.closest(fields);
  return Boolean(
    field &&
    !field.closest('[role="search"],[data-promotion-allow]') &&
    field.closest("form,[data-registration-form],[data-promotion-exclude]"),
  );
}

export function protectedPublicFormPresent() {
  const visible = (element: Element) => element.getClientRects().length > 0;
  // Cross-origin form contents cannot be inspected; exclude their frame/page.
  if (
    Array.from(
      document.querySelectorAll(
        '[data-registration-form],[data-promotion-exclude],iframe[src*="docs.google.com/forms/"]',
      ),
    ).some(visible)
  )
    return true;
  if (editingPublicForm(document.activeElement)) return true;
  return Array.from(document.querySelectorAll(fields)).some((element) => {
    if (!visible(element) || !editingPublicForm(element)) return false;
    if (element instanceof HTMLInputElement) {
      if (["checkbox", "radio"].includes(element.type))
        return element.checked !== element.defaultChecked;
      return Boolean(element.value) && element.value !== element.defaultValue;
    }
    if (element instanceof HTMLTextAreaElement)
      return Boolean(element.value) && element.value !== element.defaultValue;
    if (element instanceof HTMLSelectElement)
      return Array.from(element.options).some(
        (option) =>
          option.selected !== option.defaultSelected &&
          (option.defaultSelected || element.selectedIndex !== 0),
      );
    return false;
  });
}
