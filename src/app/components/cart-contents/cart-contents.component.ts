import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import gql from 'graphql-tag';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { DataService } from '../../providers/data.service';
import { CART_FRAGMENT } from '../../types/fragments';

@Component({
    selector: 'vsf-cart-contents',
    templateUrl: './cart-contents.component.html',
    styleUrls: ['./cart-contents.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartContentsComponent implements OnInit {
    cart$: Observable<any>;

    constructor(private dataService: DataService) {}

    ngOnInit() {
        this.cart$ = this.dataService.query(gql`
            query {
                activeOrder {
                    ...Cart
                }
            }
            ${CART_FRAGMENT}
        `).pipe(map(data => data.activeOrder));
    }

    increment(item) {
        this.adjustItemQuantity(item.id, item.quantity + 1);
    }

    decrement(item) {
        if (item.quantity > 1) {
            this.adjustItemQuantity(item.id, item.quantity - 1);
        } else {
            this.removeItem(item.id);
        }

    }

    /**
     * Filters out the Promotion adjustments for an OrderLine and aggregates the discount.
     */
    getLinePromotions(adjustments: any[]) {
        const groupedPromotions = adjustments.filter(a => a.type === 'PROMOTION')
            .reduce((groups, promotion) => {
                if (!groups[promotion.description]) {
                    groups[promotion.description] = promotion.amount;
                } else {
                    groups[promotion.description] += promotion.amount;
                }
                return groups;
            }, {});
        return Object.entries(groupedPromotions).map(([key, value]) => ({ description: key, amount: value }));
    }

    private adjustItemQuantity(id, qty) {
        this.dataService.mutate(gql`
            mutation ($id: ID!, $qty: Int!) {
                adjustItemQuantity(orderItemId: $id, quantity: $qty){
                    ...Cart
                }
            }
            ${CART_FRAGMENT}
        `, {
            id,
            qty,
        }).pipe(
            take(1),
        ).subscribe(data => {
            console.log(data);
        });
    }

    private removeItem(id) {
        this.dataService.mutate(gql`
            mutation ($id: ID!) {
                removeItemFromOrder(orderItemId: $id){
                    ...Cart
                }
            }
            ${CART_FRAGMENT}
        `, {
            id,
        }).pipe(
            take(1),
        ).subscribe(data => {
            console.log(data);
        });
    }
}
