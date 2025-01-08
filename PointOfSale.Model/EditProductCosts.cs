namespace PointOfSale.Model
{
    public class EditProductCosts
    {
        public List<int> ProductIds { get; set; }
        public decimal IncreasePercentage { get; set; }
    }

    public class ProductCost
    {
        public int ProductId { get; set; }
        public decimal? Cost { get; set; }
    }
}
