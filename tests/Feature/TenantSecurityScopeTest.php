<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Domains\Master\Models\Organization;
use App\Domains\Master\Models\Customer;
use App\Domains\Master\Models\Unit;
use App\Domains\Master\Models\TaxProfile;
use App\Domains\Master\Models\Manufacturer;
use App\Domains\Reporting\Services\SalesReportService;
use App\Domains\Reporting\Queries\SalesReportQuery;
use App\Shared\Context\TenantContext;
use App\Domains\Master\Scopes\OrganizationScope;
use InvalidArgumentException;

class TenantSecurityScopeTest extends TestCase
{
    use RefreshDatabase;

    protected Organization $org;

    protected function setUp(): void
    {
        parent::setUp();
        $this->org = Organization::create(['code' => 'SEC-ORG', 'name' => 'Security Test Org']);
    }

    public function test_contextless_query_on_tenant_data_is_denied()
    {
        // Clear any leftover tenant context
        app(TenantContext::class)->setOrganization(null);

        // Create customer under org directly using OrganizationScope::bypass
        OrganizationScope::bypass(function () {
            Customer::create([
                'organization_id' => $this->org->id,
                'name' => 'Jane Doe Tenant',
                'code' => 'CUST-SEC-01'
            ]);
        });

        // Ensure context is cleared
        app(TenantContext::class)->setOrganization(null);

        // Querying Customer with no Auth, no Header, no TenantContext MUST yield 0 records (1 = 0 DENY)
        $count = Customer::count();
        $this->assertEquals(0, $count, 'Contextless tenant query must return 0 records due to DENY scope.');
    }

    public function test_global_master_models_bypass_tenant_scoping()
    {
        app(TenantContext::class)->setOrganization(null);

        Unit::create(['code' => 'PCS-SEC', 'name' => 'Pieces Security', 'symbol' => 'PCS']);
        TaxProfile::create(['name' => 'GST Standard 18%', 'rate' => 18.00]);
        Manufacturer::create(['name' => 'Kohler Global']);

        $this->assertEquals(1, Unit::count(), 'Global master Unit must be accessible without tenant context.');
        $this->assertEquals(1, TaxProfile::count(), 'Global master TaxProfile must be accessible without tenant context.');
        $this->assertEquals(1, Manufacturer::count(), 'Global master Manufacturer must be accessible without tenant context.');
    }

    public function test_valid_tenant_context_allows_retrieving_tenant_data()
    {
        app(TenantContext::class)->setOrganization($this->org);
        Customer::create([
            'organization_id' => $this->org->id,
            'name' => 'John Tenant',
            'code' => 'CUST-SEC-02'
        ]);

        $this->assertEquals(1, Customer::count(), 'Tenant data should be accessible when TenantContext is set.');
    }

    public function test_reporting_services_throw_exception_when_organization_id_is_missing()
    {
        $service = new SalesReportService(new SalesReportQuery());

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Organization context (organization_id) is required.');

        $service->generateSalesRegisterReport([]);
    }
}
