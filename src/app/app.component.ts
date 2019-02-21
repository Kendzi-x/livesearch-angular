import { Observable, SchedulerLike, of, fromEvent } from 'rxjs';
import { Component, Injectable, OnInit } from '@angular/core';
import {
  debounceTime,
  pluck,
  distinctUntilChanged,
  switchMap,
  catchError,
  map,
  tap
} from 'rxjs/operators';
import { async } from 'rxjs/internal/scheduler/async';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class SearchService {
  private baseUrl: string = 'https://api.github.com/search/repositories?q=';

  constructor(private http: HttpClient) {}

  public searchGitHub(term: string) {
    if (term === '') {
      return of([]);
    }

    return this.http.get(this.baseUrl.concat(term))
      .pipe(
        // tap((r: any) => console.log(r.items)),
        map((r: any) => r.items)
      );
  }

  public search(source1$: Observable<Event>, schedule: SchedulerLike = async) {
    return source1$.pipe(
      debounceTime(500, schedule),
      pluck('target', 'value'),
      distinctUntilChanged(),
      switchMap((value: string) => this.searchGitHub(value))
    );
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [SearchService]
})
export class AppComponent implements OnInit {
  title = 'livesearch';
  result$ = new Observable<Object[]>();

  constructor(private _service: SearchService) {  }

  public ngOnInit() {
    const el: HTMLInputElement = document.querySelector('.live-search') as HTMLInputElement;
    const searchTerm$ = fromEvent(el, 'input');
    this.result$ = this._service.search(searchTerm$);
  }
}
