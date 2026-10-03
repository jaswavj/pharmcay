package com.billing.master;

import com.billing.core.response.ResponseDO;
import com.billing.master.dto.ActiveRequest;
import com.billing.master.dto.BatchSaveRequest;
import com.billing.master.dto.MedicineSaveRequest;
import com.billing.master.dto.NamedSaveRequest;
import com.billing.master.dto.SupplierSaveRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/master")
public class MasterController {

    private final MasterService masterService;

    @GetMapping("/types")
    public ResponseDO types() {
        return ok(masterService.namedList("types"));
    }

    @PostMapping("/types")
    public ResponseDO saveType(@RequestBody NamedSaveRequest request) {
        masterService.saveNamed("types", request);
        return ok(true);
    }

    @PostMapping("/types/{id}/active")
    public ResponseDO typeActive(@PathVariable Long id, @RequestBody ActiveRequest request) {
        masterService.setNamedActive("types", id, active(request));
        return ok(true);
    }

    @GetMapping("/units")
    public ResponseDO units() {
        return ok(masterService.namedList("units"));
    }

    @PostMapping("/units")
    public ResponseDO saveUnit(@RequestBody NamedSaveRequest request) {
        masterService.saveNamed("units", request);
        return ok(true);
    }

    @PostMapping("/units/{id}/active")
    public ResponseDO unitActive(@PathVariable Long id, @RequestBody ActiveRequest request) {
        masterService.setNamedActive("units", id, active(request));
        return ok(true);
    }

    @GetMapping("/generics")
    public ResponseDO generics() {
        return ok(masterService.namedList("generics"));
    }

    @PostMapping("/generics")
    public ResponseDO saveGeneric(@RequestBody NamedSaveRequest request) {
        masterService.saveNamed("generics", request);
        return ok(true);
    }

    @PostMapping("/generics/{id}/active")
    public ResponseDO genericActive(@PathVariable Long id, @RequestBody ActiveRequest request) {
        masterService.setNamedActive("generics", id, active(request));
        return ok(true);
    }

    @GetMapping("/lookups")
    public ResponseDO lookups() {
        return ok(masterService.lookups());
    }

    @GetMapping("/medicines")
    public ResponseDO medicines() {
        return ok(masterService.medicines());
    }

    @PostMapping("/medicines")
    public ResponseDO saveMedicine(@RequestBody MedicineSaveRequest request) {
        masterService.saveMedicine(request);
        return ok(true);
    }

    @PostMapping("/medicines/{id}/active")
    public ResponseDO medicineActive(@PathVariable Long id, @RequestBody ActiveRequest request) {
        masterService.setMedicineActive(id, active(request));
        return ok(true);
    }

    @GetMapping("/batches")
    public ResponseDO batches(@RequestParam Long medicineId) {
        return ok(masterService.batches(medicineId));
    }

    @PostMapping("/batches")
    public ResponseDO saveBatch(@RequestBody BatchSaveRequest request) {
        masterService.saveBatch(request);
        return ok(true);
    }

    @PostMapping("/batches/{id}/active")
    public ResponseDO batchActive(@PathVariable Long id, @RequestBody ActiveRequest request) {
        masterService.setBatchActive(id, active(request));
        return ok(true);
    }

    @GetMapping("/suppliers")
    public ResponseDO suppliers() {
        return ok(masterService.suppliers());
    }

    @PostMapping("/suppliers")
    public ResponseDO saveSupplier(@RequestBody SupplierSaveRequest request) {
        masterService.saveSupplier(request);
        return ok(true);
    }

    @PostMapping("/suppliers/{id}/active")
    public ResponseDO supplierActive(@PathVariable Long id, @RequestBody ActiveRequest request) {
        masterService.setSupplierActive(id, active(request));
        return ok(true);
    }

    private boolean active(ActiveRequest request) {
        return request != null && Boolean.TRUE.equals(request.getActive());
    }

    private ResponseDO ok(Object data) {
        ResponseDO response = new ResponseDO();
        response.setSuccess(true);
        response.setData(data);
        return response;
    }
}
