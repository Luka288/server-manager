import { HttpContextToken, HttpContext } from '@angular/common/http';

export const CUSTOM_LOADING_TEXT = new HttpContextToken<string | null>(
  () => null,
);

export const SKIP_GLOBAL_LOADER = new HttpContextToken<boolean>(() => false);

export function silentRequest(): HttpContext {
  return new HttpContext().set(SKIP_GLOBAL_LOADER, true);
}

export function withCustomText(text: string): HttpContext {
  return new HttpContext().set(CUSTOM_LOADING_TEXT, text);
}
