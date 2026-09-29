<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if ($this->app->bound(\App\Shared\Context\TenantContext::class)) {
            $context = $this->app->make(\App\Shared\Context\TenantContext::class);
            $context->setOrganization(null);
            $context->setUser(null);
            $context->setBranch(null);
            $context->setPermissions(null);
        }
    }
}

