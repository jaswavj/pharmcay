package com.billing.purchase;

import com.billing.core.response.ResponseDO;
import com.billing.purchase.dto.DecisionRequest;
import com.billing.purchase.dto.PoSaveRequest;
import com.billing.purchase.dto.PurchaseSaveRequest;
import com.billing.purchase.dto.ReturnSaveRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/purchase")
public class PurchaseController {

    private final PurchaseService purchaseService;

    @GetMapping("/orders")
    public ResponseDO orders(@RequestParam(required = false) Integer status) {
        return ok(purchaseService.orders(status));
    }

    @GetMapping("/open-orders")
    public ResponseDO openOrders() {
        return ok(purchaseService.openOrders());
    }

    @GetMapping("/orders/{id}")
    public ResponseDO order(@PathVariable Long id) {
        return ok(purchaseService.order(id));
    }

    @PostMapping("/orders")
    public ResponseDO saveOrder(@RequestBody PoSaveRequest request) {
        return ok(Map.of("poNo", purchaseService.saveOrder(request)));
    }

    @PostMapping("/orders/{id}")
    public ResponseDO updateOrder(@PathVariable Long id, @RequestBody PoSaveRequest request) {
        purchaseService.updateOrder(id, request);
        return ok(true);
    }

    @PostMapping("/orders/{id}/decision")
    public ResponseDO decide(@PathVariable Long id, @RequestBody DecisionRequest request) {
        purchaseService.decide(id, request);
        return ok(true);
    }

    @PostMapping("/orders/{id}/close")
    public ResponseDO closeOrder(@PathVariable Long id) {
        purchaseService.closeOrder(id);
        return ok(true);
    }

    @GetMapping("/batches")
    public ResponseDO batches(@RequestParam Long medicineId) {
        return ok(purchaseService.medicineBatches(medicineId));
    }

    @GetMapping("/entries")
    public ResponseDO entries(@RequestParam String from, @RequestParam String to) {
        return ok(purchaseService.entries(from, to));
    }

    @GetMapping("/entries/{id}")
    public ResponseDO entry(@PathVariable Long id) {
        return ok(purchaseService.purchase(id));
    }

    @PostMapping("/entries")
    public ResponseDO saveEntry(@RequestBody PurchaseSaveRequest request) {
        return ok(Map.of("prNo", purchaseService.saveEntry(request)));
    }

    @GetMapping("/purchase-report")
    public ResponseDO purchaseReport(@RequestParam String from, @RequestParam String to) {
        return ok(purchaseService.purchaseReport(from, to));
    }

    @GetMapping("/return-report")
    public ResponseDO returnReport(@RequestParam String from, @RequestParam String to) {
        return ok(purchaseService.returnReport(from, to));
    }

    @GetMapping("/supplier-purchase")
    public ResponseDO supplierPurchase(@RequestParam String from, @RequestParam String to, @RequestParam Long supplierId) {
        return ok(purchaseService.supplierPurchase(from, to, supplierId));
    }

    @GetMapping("/returns")
    public ResponseDO returns() {
        return ok(purchaseService.returns());
    }

    @PostMapping("/returns")
    public ResponseDO saveReturn(@RequestBody ReturnSaveRequest request) {
        return ok(Map.of("retNo", purchaseService.saveReturn(request)));
    }

    @GetMapping("/stock")
    public ResponseDO stock() {
        return ok(purchaseService.stock());
    }

    @GetMapping("/stock-transactions")
    public ResponseDO stockTransactions(@RequestParam Long medicineId, @RequestParam String from, @RequestParam String to) {
        return ok(purchaseService.stockTransactions(medicineId, from, to));
    }

    private ResponseDO ok(Object data) {
        ResponseDO response = new ResponseDO();
        response.setSuccess(true);
        response.setData(data);
        return response;
    }
}
