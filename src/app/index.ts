import { fromEvent, Observable, of, SchedulerLike } from 'rxjs';
import {
  map,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  pluck
} from 'rxjs/operators';
import { ajax } from 'rxjs/ajax';
import { async } from 'rxjs/internal/scheduler/async';

import { ISearchOptions } from './searchOptions.interface';

const el: HTMLInputElement = document.querySelector('.live-search') as HTMLInputElement;
const searchInputSequence$: Observable<Event> = fromEvent(el, 'input');

const div: HTMLElement = document.getElementById('list');

function search(
  source1$: Observable<Event>,
  sourceCreator: (value: string) => Observable<Object[]>,
  schedule: SchedulerLike = async
): Observable<Object[]> {
  return source1$.pipe(
    debounceTime(500, schedule),
    pluck('target', 'value'),
    distinctUntilChanged(),
    switchMap((value: string) =>
      sourceCreator(value).pipe(
        catchError(() => of([]))
        )
    )
  );
}

function searchAjax(term: string): Observable<Object[]> {
  if (term === '') {
    return of([]);
  }

  return ajax(`https://api.github.com/search/repositories?q=${term}`).pipe(
    // tslint:disable-next-line:no-any
    map((r: any) => r.response.items)
  );
}

function render(ev: Object[]): void {
  div.innerHTML = '';
    if (ev === undefined || ev.length === 0) {
      return;
    }
    const ul: HTMLUListElement = document.createElement('ul');
    div.appendChild(ul);

    for (let i: number = 0; i < ev.length; i++) {
      const li: HTMLLIElement = document.createElement('li');
      const elem: ISearchOptions = ev[i];
      li.innerHTML = `<a href="${elem.html_url}" target="_blank">
    ${elem.name} with (${elem.stargazers_count} star(s))</a>`;
      ul.appendChild(li);
    }
}

search(searchInputSequence$, searchAjax)
  .subscribe((result: Object[]) => render(result));
