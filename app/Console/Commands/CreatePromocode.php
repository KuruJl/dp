<?php

namespace App\Console\Commands;

use App\Models\Promocode;
use Illuminate\Console\Command;

class CreatePromocode extends Command
{
    protected $signature = 'promo:create
                            {code : Код промокода}
                            {type : percent или fixed}
                            {value : Размер скидки}
                            {--min=0 : Минимальная сумма заказа}
                            {--limit= : Лимит использований}
                            {--until= : Срок действия (Y-m-d или Y-m-d H:i:s)}';

    protected $description = 'Создать промокод для корзины и оформления заказа';

    public function handle(): int
    {
        $code = strtoupper(trim((string) $this->argument('code')));
        $type = strtolower(trim((string) $this->argument('type')));
        $value = (float) $this->argument('value');
        $min = (float) $this->option('min');
        $limit = $this->option('limit') !== null ? (int) $this->option('limit') : null;
        $until = $this->option('until') ?: null;

        if (!in_array($type, ['percent', 'fixed'], true)) {
            $this->error('Тип должен быть percent или fixed.');
            return self::FAILURE;
        }

        if ($value <= 0) {
            $this->error('Значение скидки должно быть больше 0.');
            return self::FAILURE;
        }

        if ($type === 'percent' && $value > 100) {
            $this->error('Процентная скидка не может быть больше 100.');
            return self::FAILURE;
        }

        if ($limit !== null && $limit < 1) {
            $this->error('Лимит использований должен быть >= 1.');
            return self::FAILURE;
        }

        $promocode = Promocode::updateOrCreate(
            ['code' => $code],
            [
                'type' => $type,
                'value' => $value,
                'min_order_amount' => max(0, $min),
                'usage_limit' => $limit,
                'valid_until' => $until,
                'is_active' => true,
            ]
        );

        $this->info("Промокод {$promocode->code} сохранен.");
        $this->line("Тип: {$promocode->type}");
        $this->line("Скидка: {$promocode->value}");
        $this->line("Минимальный заказ: {$promocode->min_order_amount}");
        $this->line('Лимит: ' . ($promocode->usage_limit ?? 'безлимит'));
        $this->line('Действует до: ' . ($promocode->valid_until ?? 'бессрочно'));

        return self::SUCCESS;
    }
}
