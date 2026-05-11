<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('promocodes', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->after('used_count')->constrained()->nullOnDelete();
            $table->foreignId('restricted_user_id')->nullable()->after('category_id')->constrained('users')->nullOnDelete();
            $table->boolean('first_order_only')->default(false)->after('restricted_user_id');
            $table->boolean('admin_only')->default(false)->after('first_order_only');
        });
    }

    public function down(): void
    {
        Schema::table('promocodes', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropForeign(['restricted_user_id']);
            $table->dropColumn(['category_id', 'restricted_user_id', 'first_order_only', 'admin_only']);
        });
    }
};
