<?php

namespace App\Services;

use App\Models\Product;

class CompatibilityService
{
    /**
     * Основной метод проверки совместимости.
     * Принимает массив объектов Product (или коллекцию).
     */
    public function checkAssembly($components): array
    {
        $errors =[];

        // Внимание: проверь, что слаги категорий совпадают с теми, что у тебя в БД!
        // В БД они могли сгенерироваться как 'processory', 'videokarty' и т.д.
        $cpu = $this->findComponentByCategory($components, 'processory'); 
        $motherboard = $this->findComponentByCategory($components, 'materinskie-platy');
        $ram = $this->findComponentByCategory($components, 'operativnaia-pamiat');
        $gpu = $this->findComponentByCategory($components, 'videokarty'); 
        $psu = $this->findComponentByCategory($components, 'bloki-pitaniia'); 
        $case = $this->findComponentByCategory($components, 'korpusa'); 

        if ($cpu && $motherboard) {
            $errors = array_merge($errors, $this->checkCpuAndMotherboard($cpu, $motherboard));
        }
        if ($ram && $motherboard) {
            $errors = array_merge($errors, $this->checkRamAndMotherboard($ram, $motherboard));
        }
        if ($gpu && $psu) {
            $errors = array_merge($errors, $this->checkGpuAndPsu($gpu, $psu));
        }
        if ($gpu && $case) {
            $errors = array_merge($errors, $this->checkGpuAndCase($gpu, $case));
        }
        if ($gpu && $motherboard) {
            $errors = array_merge($errors, $this->checkGpuAndMotherboard($gpu, $motherboard));
        }

        return $errors;
    }

    /**
     * Помощник для поиска нужного товара в массиве выбранных комплектующих
     */
    protected function findComponentByCategory($components, string $categorySlug): ?Product
    {
        foreach ($components as $component) {
            // Проверяем связь с категорией и её слаг
            if ($component->category && $component->category->slug === $categorySlug) {
                return $component;
            }
        }
        return null;
    }

    /**
     * Проверка: Процессор + Материнская плата (Сокет)
     */
    protected function checkCpuAndMotherboard(Product $cpu, Product $motherboard): array
    {
        $errors =[];
        
        // Используем метод getSpec() из нашей модели Product
        $cpuSocket = $cpu->getSpec('Сокет');
        $motherboardSocket = $motherboard->getSpec('Сокет'); // У мат.платы тоже должна быть характеристика "Сокет"
        
        if (!$cpuSocket || !$motherboardSocket) {
            $errors[] = "Не удалось определить сокет для процессора или материнской платы.";
            return $errors;
        }

        // Убираем лишние пробелы и приводим к нижнему регистру для надежного сравнения
        if (mb_strtolower(trim($cpuSocket)) !== mb_strtolower(trim($motherboardSocket))) {
            $errors[] = "Несовместимость: сокет процессора ({$cpuSocket}) не совпадает с сокетом материнской платы ({$motherboardSocket}).";
        }

        return $errors;
    }

    /**
     * Проверка: ОЗУ + Материнская плата (Тип памяти)
     */
    protected function checkRamAndMotherboard(Product $ram, Product $motherboard): array
    {
        $errors =[];

        $ramType = $ram->getSpec('Тип памяти');
        $motherboardRamType = $motherboard->getSpec('Тип поддерживаемой памяти');
        
        if (!$ramType || !$motherboardRamType) {
            $errors[] = "Не удалось определить тип памяти для RAM или материнской платы.";
            return $errors;
        }

        if (!str_contains(mb_strtolower($motherboardRamType), mb_strtolower($ramType))) {
            $errors[] = "Несовместимость: тип оперативной памяти ({$ramType}) не поддерживается материнской платой (поддерживает: {$motherboardRamType}).";
        }

        return $errors;
    }

    /**
     * Проверка: Видеокарта + Блок питания (Мощность)
     */
    protected function checkGpuAndPsu(Product $gpu, Product $psu): array
    {
        $errors =[];
        
        $gpuRecommendedPsu = (int) filter_var($gpu->getSpec('Рекомендуемый блок питания'), FILTER_SANITIZE_NUMBER_INT);
        $psuPower = (int) filter_var($psu->getSpec('Мощность (номинал)'), FILTER_SANITIZE_NUMBER_INT);

        if ($gpuRecommendedPsu > 0 && $psuPower > 0 && $psuPower < $gpuRecommendedPsu) {
            $errors[] = "Несовместимость: мощность блока питания ({$psuPower} Вт) меньше, чем рекомендуется для видеокарты ({$gpuRecommendedPsu} Вт).";
        }
        return $errors;
    }

    /**
     * Проверка: Видеокарта + Корпус (Длина)
     */
    protected function checkGpuAndCase(Product $gpu, Product $case): array
    {
        $errors =[];
        $gpuLength = (int) filter_var($gpu->getSpec('Длина видеокарты'), FILTER_SANITIZE_NUMBER_INT);
        $caseMaxGpuLength = (int) filter_var($case->getSpec('Максимальная длина устанавливаемой видеокарты'), FILTER_SANITIZE_NUMBER_INT);

        if ($gpuLength > 0 && $caseMaxGpuLength > 0 && $gpuLength > $caseMaxGpuLength) {
            $errors[] = "Несовместимость: видеокарта длиной {$gpuLength} мм не поместится в корпус (макс. длина {$caseMaxGpuLength} мм).";
        }
        return $errors;
    }

    /**
     * Проверка: Видеокарта + Материнская плата (Слот PCIe)
     */
    protected function checkGpuAndMotherboard(Product $gpu, Product $motherboard): array
    {
        $errors =[];

        $gpuInterface = $gpu->getSpec('Интерфейс подключения');
        $motherboardPcieSlots = $motherboard->getSpec('Слоты PCIe x16');

        if ($motherboardPcieSlots === null) {
            return $errors;
        }

        if (!str_contains(strtolower($motherboardPcieSlots), 'x16')) {
            $errors[] = "Несовместимость: на материнской плате не найден слот PCI-E x16 для установки видеокарты.";
        } else {
            $gpuVersion = (float) filter_var($gpuInterface, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
            $mbVersionText = explode(' ', $motherboardPcieSlots)[2] ?? '0.0'; 
            $mbVersion = (float) filter_var($mbVersionText, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
            
            // Записываем предупреждение, как у тебя и было задумано
            if ($gpuVersion > 0 && $mbVersion > 0 && $gpuVersion > $mbVersion) {
                $errors[] = "Предупреждение: видеокарта PCIe {$gpuVersion} будет работать в режиме PCIe {$mbVersion} на данной материнской плате.";
            }
        }
        
        return $errors;
    }
}